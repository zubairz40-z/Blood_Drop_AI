/**
 * AI Manager — the top-level coordination agent.
 *
 * Receives structured results from the specialized agents
 * (matching, eligibility, geo, risk) and produces one final
 * coordination recommendation: a primary donor, backups, and
 * next action.
 *
 * Arefa's three agents (donor matching, eligibility, geo coordination)
 * are not wired yet. Their results arrive as injected input objects,
 * so this manager works today with mock/test data and will work
 * identically when real agent outputs replace the mocks.
 *
 * This module is purely deterministic — no LLM calls, no DB writes.
 */

const { analyzeRisk } = require("./riskAdvisorAgent");

// ---------------------------------------------------------------------------
// Next-action constants
// ---------------------------------------------------------------------------

const ACTIONS = {
  CONTACT_PRIMARY_DONOR: "CONTACT_PRIMARY_DONOR",
  EXPAND_SEARCH: "EXPAND_SEARCH",
  NO_ELIGIBLE_CANDIDATES: "NO_ELIGIBLE_CANDIDATES",
  MANUAL_REVIEW_REQUIRED: "MANUAL_REVIEW_REQUIRED",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if a candidate object indicates a usable donor.
 * A candidate must exist, have a donorId, and be both eligible and available.
 */
function isCandidateViable(candidate) {
  if (!candidate || typeof candidate !== "object") return false;
  if (!candidate.donorId) return false;
  if (candidate.eligible !== true) return false;
  if (candidate.available !== true) return false;
  return true;
}

/**
 * Builds a deterministic explanation string from the supplied data.
 */
function buildExplanation(primary, viableCount, riskResult) {
  if (!primary) return "No eligible candidates found for this request.";

  const parts = [];
  if (primary.reasons && primary.reasons.length > 0) {
    parts.push(primary.reasons[0].toLowerCase());
  }
  if (primary.distanceKm != null) {
    parts.push(
      `distance is ${primary.distanceKm} km`
    );
  }
  if (primary.etaMinutes != null) {
    parts.push(`ETA is ${primary.etaMinutes} min`);
  }
  if (primary.score != null) {
    parts.push(`match score ${primary.score}`);
  }

  let explanation = parts.length > 0
    ? `Recommended donor: ${primary.donorId}. ${parts.join(", ")}.`
    : `Recommended donor: ${primary.donorId}.`;

  if (riskResult && riskResult.riskLevel !== "LOW") {
    explanation += ` Risk level is ${riskResult.riskLevel}.`;
  }

  if (viableCount > 1) {
    explanation += ` ${viableCount} viable candidates available.`;
  }

  return explanation;
}

// ---------------------------------------------------------------------------
// Main coordination function
// ---------------------------------------------------------------------------

/**
 * Coordinates available agent outputs into a single recommendation.
 *
 * @param {object} params
 * @param {object} params.request          — the blood request being coordinated
 * @param {string} params.requestId        — request identifier
 * @param {object} [params.matchingResult] — output from donor matching agent
 * @param {object} [params.eligibilityResult] — output from eligibility agent
 * @param {object} [params.geoResult]      — output from geo coordination agent
 * @param {object} [params.riskResult]     — output from risk advisor (or null to compute)
 * @param {object} [params.riskSignals]    — raw signals for risk advisor if riskResult not supplied
 * @returns {object} final coordination result
 */
function coordinate(params) {
  const {
    requestId = null,
    matchingResult = null,
    riskResult = null,
    riskSignals = null,
  } = params || {};

  // --- 1. Compute risk if not already supplied ---
  let risk = riskResult;
  if (!risk) {
    try {
      risk = analyzeRisk(riskSignals || {});
    } catch {
      risk = { riskScore: 0, riskLevel: "LOW", reasons: [], recommendation: "Unable to compute risk." };
    }
  }

  // --- 2. Validate the request has an ID ---
  if (!requestId) {
    return {
      requestId: null,
      risk: risk.riskLevel,
      riskScore: risk.riskScore,
      recommendedDonor: null,
      backupDonors: [],
      nextAction: ACTIONS.MANUAL_REVIEW_REQUIRED,
      explanation: "Request ID is missing. Manual review required.",
    };
  }

  // --- 3. Extract viable candidates from matching results ---
  const allCandidates =
    matchingResult && Array.isArray(matchingResult.candidates)
      ? matchingResult.candidates
      : [];

  const viableCandidates = allCandidates.filter(isCandidateViable);

  // --- 4. No candidates at all ---
  if (viableCandidates.length === 0) {
    return {
      requestId,
      risk: risk.riskLevel,
      riskScore: risk.riskScore,
      recommendedDonor: null,
      backupDonors: [],
      nextAction: allCandidates.length > 0
        ? ACTIONS.NO_ELIGIBLE_CANDIDATES
        : ACTIONS.EXPAND_SEARCH,
      explanation: allCandidates.length > 0
        ? "Candidates exist but none are eligible or available."
        : "No candidates found. Search radius should be expanded.",
    };
  }

  // --- 5. Critical risk + viable candidates → cautious advisory ---
  if (risk.riskLevel === "CRITICAL") {
    return {
      requestId,
      risk: risk.riskLevel,
      riskScore: risk.riskScore,
      recommendedDonor: viableCandidates[0].donorId,
      backupDonors: viableCandidates.slice(1).map((c) => c.donorId),
      nextAction: ACTIONS.MANUAL_REVIEW_REQUIRED,
      explanation: buildExplanation(viableCandidates[0], viableCandidates.length, risk),
    };
  }

  // --- 6. Normal path — pick best candidate (first in supplied order) ---
  const primary = viableCandidates[0];
  const backups = viableCandidates.slice(1).map((c) => c.donorId);

  return {
    requestId,
    risk: risk.riskLevel,
    riskScore: risk.riskScore,
    recommendedDonor: primary.donorId,
    backupDonors: backups,
    nextAction: ACTIONS.CONTACT_PRIMARY_DONOR,
    explanation: buildExplanation(primary, viableCandidates.length, risk),
  };
}

module.exports = { coordinate, ACTIONS };
