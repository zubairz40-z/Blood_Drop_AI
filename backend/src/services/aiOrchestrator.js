/**
 * AI Orchestrator — the reusable coordination workflow.
 *
 * Coordinates the Risk & Advisor Agent and the AI Manager into
 * one deterministic pipeline. Arefa's three agent outputs
 * (matching, eligibility, geo) arrive as injected structured input
 * and are passed through unchanged for now.
 *
 * Later, the same orchestrator replaces injected values with
 * real agent/service calls without changing its public API.
 *
 * This module is purely deterministic — no LLM calls, no DB writes.
 */

const { analyzeRisk } = require("../agents/riskAdvisorAgent");
const { coordinate } = require("../agents/aiManager");

// ---------------------------------------------------------------------------
// Input defaults
// ---------------------------------------------------------------------------

const EMPTY_RISK_CONTEXT = {
  requestCountRecent: 0,
  emergencyRequestsRecent: 0,
  cancelledRequestsRecent: 0,
  donorActivityCount: 0,
  emergencyResponseMinutes: 0,
  bloodGroupDemandCount: 0,
};

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Orchestrates the current AI workflow for a single blood request.
 *
 * @param {object} input
 * @param {object} input.request          — the blood request (must have an id)
 * @param {object} [input.matchingResult]  — donor matching agent output
 * @param {object} [input.eligibilityResult] — eligibility agent output
 * @param {object} [input.geoResult]       — geo coordination agent output
 * @param {object} [input.riskContext]      — raw signals for risk advisor
 * @returns {object} final coordination result
 */
function coordinateRequest(input) {
  const {
    request = null,
    matchingResult = null,
    eligibilityResult = null,
    geoResult = null,
    riskContext = null,
  } = input || {};

  // --- 1. Validate the request has an id ---
  if (!request || typeof request !== "object") {
    return {
      requestId: null,
      risk: "LOW",
      riskScore: 0,
      recommendedDonor: null,
      backupDonors: [],
      nextAction: "MANUAL_REVIEW_REQUIRED",
      explanation: "Request is missing or malformed.",
    };
  }

  if (!request.id) {
    return {
      requestId: null,
      risk: "LOW",
      riskScore: 0,
      recommendedDonor: null,
      backupDonors: [],
      nextAction: "MANUAL_REVIEW_REQUIRED",
      explanation: "Request is missing or malformed.",
    };
  }

  // --- 2. Run Risk & Advisor Agent ---
  const riskInput = riskContext || EMPTY_RISK_CONTEXT;
  const riskResult = analyzeRisk(riskInput);

  // --- 3. Pass all outputs into AI Manager ---
  const result = coordinate({
    requestId: request.id,
    matchingResult,
    riskResult,
  });

  // Enrich with eligibility and geo metadata for downstream use
  // (not consumed by AI Manager yet, but preserved in the result contract)
  if (eligibilityResult) {
    result.eligibilityResult = eligibilityResult;
  }
  if (geoResult) {
    result.geoResult = geoResult;
  }

  return result;
}

module.exports = { coordinateRequest };
