/**
 * Risk & Advisor Agent — deterministic rule-based risk analysis.
 *
 * Produces decision-support information for administrators by
 * detecting suspicious request activity, unusual donor/system
 * patterns, long emergency response times, and high-demand conditions.
 *
 * This agent is purely algorithmic — it never calls an LLM,
 * never modifies the database, and never makes medical decisions.
 */

// ---------------------------------------------------------------------------
// Thresholds — named constants so every boundary is readable and testable.
// ---------------------------------------------------------------------------

/** How many requests from a single account within the window is considered high. */
const HIGH_REQUEST_VOLUME = 20;

/** How many emergency requests in a short period is concerning. */
const HIGH_EMERGENCY_VOLUME = 5;

/** How many cancelled requests from one account is suspicious. */
const HIGH_CANCEL_RATE = 6;

/** How many different donors being active simultaneously is unusual. */
const HIGH_DONOR_ACTIVITY = 30;

/** Minutes beyond which an emergency response is considered slow. */
const SLOW_EMERGENCY_RESPONSE = 60;

/** How many requests targeting the same blood group in a window is a spike. */
const HIGH_BLOOD_GROUP_DEMAND = 8;

// ---------------------------------------------------------------------------
// Risk score weights — each signal contributes a fixed number of points.
// ---------------------------------------------------------------------------

const WEIGHT_HIGH_REQUEST_VOLUME = 20;
const WEIGHT_HIGH_EMERGENCY_VOLUME = 25;
const WEIGHT_HIGH_CANCEL_RATE = 15;
const WEIGHT_HIGH_DONOR_ACTIVITY = 10;
const WEIGHT_SLOW_EMERGENCY_RESPONSE = 20;
const WEIGHT_HIGH_BLOOD_GROUP_DEMAND = 15;

// ---------------------------------------------------------------------------
// Helper — safely coerce a value to a non-negative number.
// ---------------------------------------------------------------------------

/**
 * Returns n as a non-negative finite number, or 0 if it is not a valid number.
 */
function safeNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

/**
 * Clamps a number to 0–100.
 */
function clamp(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

/**
 * Analyses a set of operational signals and returns a risk assessment.
 *
 * @param {object} signals
 * @param {number} [signals.requestCountRecent]        — total recent requests from one account
 * @param {number} [signals.emergencyRequestsRecent]   — emergency requests in the window
 * @param {number} [signals.cancelledRequestsRecent]   — cancelled requests from the account
 * @param {number} [signals.donorActivityCount]        — number of active donors
 * @param {number} [signals.emergencyResponseMinutes]  — minutes since emergency was filed
 * @param {number} [signals.bloodGroupDemandCount]     — requests targeting the same blood group
 * @returns {{ riskScore: number, riskLevel: string, reasons: string[], recommendation: string }}
 */
function analyzeRisk(signals) {
  const s = {
    requestCountRecent: safeNumber(signals.requestCountRecent),
    emergencyRequestsRecent: safeNumber(signals.emergencyRequestsRecent),
    cancelledRequestsRecent: safeNumber(signals.cancelledRequestsRecent),
    donorActivityCount: safeNumber(signals.donorActivityCount),
    emergencyResponseMinutes: safeNumber(signals.emergencyResponseMinutes),
    bloodGroupDemandCount: safeNumber(signals.bloodGroupDemandCount),
  };

  let score = 0;
  const reasons = [];

  if (s.requestCountRecent > HIGH_REQUEST_VOLUME) {
    score += WEIGHT_HIGH_REQUEST_VOLUME;
    reasons.push("Repeated emergency requests detected");
  }

  if (s.emergencyRequestsRecent > HIGH_EMERGENCY_VOLUME) {
    score += WEIGHT_HIGH_EMERGENCY_VOLUME;
    reasons.push("High volume of emergency requests in a short period");
  }

  if (s.cancelledRequestsRecent > HIGH_CANCEL_RATE) {
    score += WEIGHT_HIGH_CANCEL_RATE;
    reasons.push("Unusually high number of cancelled requests");
  }

  if (s.donorActivityCount > HIGH_DONOR_ACTIVITY) {
    score += WEIGHT_HIGH_DONOR_ACTIVITY;
    reasons.push("Abnormally high donor activity detected");
  }

  if (s.emergencyResponseMinutes > SLOW_EMERGENCY_RESPONSE) {
    score += WEIGHT_SLOW_EMERGENCY_RESPONSE;
    reasons.push("Emergency response time is unusually long");
  }

  if (s.bloodGroupDemandCount > HIGH_BLOOD_GROUP_DEMAND) {
    score += WEIGHT_HIGH_BLOOD_GROUP_DEMAND;
    reasons.push("Unusually high demand for a single blood group");
  }

  const riskScore = clamp(score);

  const riskLevel = riskScore >= 75 ? "CRITICAL"
    : riskScore >= 50 ? "HIGH"
    : riskScore >= 25 ? "MEDIUM"
    : "LOW";

  const recommendation = riskLevel === "LOW"
    ? "No immediate action required. Continue monitoring."
    : riskLevel === "MEDIUM"
    ? "Administrator review is recommended."
    : riskLevel === "HIGH"
    ? "Urgent administrator review is recommended."
    : "Critical situation — immediate administrator intervention required.";

  return { riskScore, riskLevel, reasons, recommendation };
}

module.exports = { analyzeRisk };
