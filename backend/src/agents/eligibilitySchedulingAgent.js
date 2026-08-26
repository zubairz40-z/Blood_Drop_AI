const matchingService = require("../services/matchingService");
const DonorProfile = require("../models/DonorProfile");
const BloodRequest = require("../models/BloodRequest");
const { checkEligibility } = require("../utils/donationRules");

/**
 * AI Agent #3 — Eligibility & Scheduling Agent.
 *
 * Sorts donors into three buckets: eligible now, eligible on a known future
 * date, and permanently excluded for this request.
 *
 * Every verdict here comes from checkEligibility, the deterministic rules
 * function. This agent contains no medical logic of its own and never calls
 * Gemini — an LLM deciding whether someone may donate blood is exactly the
 * failure mode the architecture exists to prevent. Gemini may later phrase
 * these results more warmly; it may not change them.
 */

/**
 * How far ahead a future eligibility date is still useful. A donor who
 * becomes eligible after the blood is needed is not worth scheduling.
 */
const DEFAULT_HORIZON_DAYS = 30;

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

/**
 * Assesses a set of donors against a request.
 *
 * @param {string} requestId
 * @param {object} options
 * @param {string[]} options.donorIds  Which donors to assess. Defaults to the
 *   candidates from the matching funnel, but can be given explicitly — a
 *   hospital may want to know why a specific person wasn't contacted.
 * @param {object} options.candidateSet  Shared funnel result, so the Manager
 *   can run the query once across all agents.
 */
async function assessDonors(
  requestId,
  { donorIds, candidateSet, horizonDays = DEFAULT_HORIZON_DAYS, asOf = new Date() } = {}
) {
  const request = await BloodRequest.findById(requestId);
  if (!request) fail("Request not found.", 404);

  // Candidates from the funnel are eligible by construction — findCandidates
  // already dropped anyone who failed checkEligibility. So the interesting
  // work is assessing donors *beyond* that list.
  const set =
    candidateSet ?? (await matchingService.findCandidates(requestId, { asOf }));

  const eligibleNow = [];
  const later = [];
  const excluded = [];

  const horizon = new Date(asOf);
  horizon.setDate(horizon.getDate() + horizonDays);

  // The funnel's candidates need no re-checking; re-running the rules here
  // would risk a different answer if time passed between the two calls.
  for (const c of set.candidates || []) {
    eligibleNow.push({
      donorId: c.donorId,
      bloodGroup: c.bloodGroup,
      distanceKm: c.distanceKm,
      etaMinutes: c.etaMinutes,
    });
  }

  const alreadySeen = new Set(eligibleNow.map((d) => d.donorId));

  // Anyone explicitly named who wasn't in the funnel gets a full explanation
  const extra = (donorIds || []).filter((id) => !alreadySeen.has(String(id)));

  for (const donorId of extra) {
    const verdict = await matchingService.explainDonor(requestId, donorId, asOf);

    if (verdict.eligible) {
      const profile = await DonorProfile.findOne({ user: donorId });
      eligibleNow.push({
        donorId: String(donorId),
        bloodGroup: profile?.bloodGroup,
        distanceKm: null,
        etaMinutes: null,
      });
      continue;
    }

    // A future date means the block clears on its own; null means it never
    // will (wrong blood group, over the age limit, doesn't offer the component).
    const next = verdict.nextEligibleAt;

    if (next && new Date(next) <= horizon) {
      later.push({
        donorId: String(donorId),
        nextEligibleAt: next,
        reasons: verdict.reasons,
      });
    } else {
      excluded.push({
        donorId: String(donorId),
        reasons: verdict.reasons,
        nextEligibleAt: next ?? null,
      });
    }
  }

  return {
    requestId: String(requestId),
    assessedAt: asOf.toISOString(),
    horizonDays,

    eligibleNow: eligibleNow.map((d) => d.donorId),
    later,
    excluded,

    // Fuller records for the UI, which wants distance alongside the verdict
    eligibleNowDetail: eligibleNow,

    // Whether this request can be served at all right now
    sufficient: eligibleNow.length >= request.unitsRequired,
    unitsRequired: request.unitsRequired,
    summary: buildSummary(eligibleNow.length, later.length, excluded.length, request),
  };
}

/**
 * Deterministic summary text. This is the fallback if Gemini is unavailable,
 * so the system can always explain a scheduling picture unaided.
 */
function buildSummary(nowCount, laterCount, excludedCount, request) {
  if (nowCount === 0) {
    return laterCount > 0
      ? `No donors are eligible today; ${laterCount} become eligible within the horizon.`
      : "No eligible donors were found for this request.";
  }

  const enough = nowCount >= request.unitsRequired;
  const parts = [
    `${nowCount} donor${nowCount === 1 ? "" : "s"} eligible now for ${request.unitsRequired} unit${request.unitsRequired === 1 ? "" : "s"}`,
  ];

  if (!enough) parts.push("which is short of the requirement");
  if (laterCount > 0) parts.push(`${laterCount} eligible later`);
  if (excludedCount > 0) parts.push(`${excludedCount} excluded`);

  return parts.join(", ") + ".";
}

/**
 * Single-donor assessment. Thin pass-through to the deterministic explainer,
 * exposed so a hospital can ask "why wasn't this person contacted?"
 */
async function assessOne(requestId, donorId, asOf = new Date()) {
  return matchingService.explainDonor(requestId, donorId, asOf);
}

module.exports = {
  assessDonors,
  assessOne,
  DEFAULT_HORIZON_DAYS,
};