const matchingService = require("../services/matchingService");
const { ASSUMED_SPEED_KMH } = require("../utils/donationRules");

/**
 * AI Agent #4 — Geo Coordination Agent.
 *
 * The shortest of the three, because distance and ETA are already computed by
 * the time it runs. Its job is purely spatial coordination: which donor can
 * physically arrive soonest, whether anyone can make the deadline at all, and
 * how spread out the candidate pool is.
 *
 * Note that "closest" and "soonest" are the same thing here, because ETA is
 * derived from straight-line distance. They would diverge under a real routing
 * API — a donor 3 km away across a river can be slower than one 6 km away on a
 * clear road. This agent is written to rank on ETA rather than distance so
 * that swapping in Distance Matrix changes nothing but the numbers.
 */

/** Below this many minutes apart, two donors are treated as equally close. */
const ETA_TIE_MINUTES = 5;

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

/**
 * Ranks candidates spatially and reports whether the deadline is reachable.
 *
 * @param {string} requestId
 * @param {object} options
 * @param {object} options.candidateSet  Shared funnel result from the Manager
 * @param {Date}   options.neededBy      Deadline to check ETAs against
 */
async function coordinate(
  requestId,
  { candidateSet, neededBy, asOf = new Date() } = {}
) {
  const set =
    candidateSet ?? (await matchingService.findCandidates(requestId, { asOf }));

  const candidates = set.candidates || [];

  if (candidates.length === 0) {
    return {
      requestId: String(requestId),
      preferred: null,
      backup: null,
      byEta: [],
      reachableCount: 0,
      spreadKm: null,
      summary: "No donors in range to coordinate.",
    };
  }

  // Sort by arrival time, not score. The matching agent already picked on
  // overall fitness; this agent's only question is who gets there first.
  const byEta = [...candidates].sort(
    (a, b) => a.etaMinutes - b.etaMinutes || a.distanceKm - b.distanceKm
  );

  const preferred = byEta[0];
  const backup = byEta[1] ?? null;

  // How many could physically arrive before the blood is needed
  const deadline = neededBy ? new Date(neededBy) : null;
  const minutesAvailable = deadline
    ? Math.floor((deadline - asOf) / 60000)
    : null;

  const reachable =
    minutesAvailable === null
      ? byEta
      : byEta.filter((c) => c.etaMinutes <= minutesAvailable);

  // Spread tells the Manager whether the pool is clustered or scattered —
  // a tight cluster means a decline costs little, a wide spread means the
  // second choice is materially worse.
  const distances = candidates.map((c) => c.distanceKm);
  const spreadKm =
    Math.round((Math.max(...distances) - Math.min(...distances)) * 10) / 10;

  const gap = backup ? backup.etaMinutes - preferred.etaMinutes : null;
  const clearWinner = gap === null || gap >= ETA_TIE_MINUTES;

  return {
    requestId: String(requestId),
    preferred: preferred.donorId,
    backup: backup ? backup.donorId : null,

    // Full ordering, so the notification layer can work down the list
    byEta: byEta.map((c) => ({
      donorId: c.donorId,
      distanceKm: c.distanceKm,
      etaMinutes: c.etaMinutes,
    })),

    reachableCount: reachable.length,
    minutesAvailable,
    spreadKm,
    etaGapMinutes: gap,
    clearWinner,
    assumedSpeedKmh: ASSUMED_SPEED_KMH,
    summary: buildSummary(preferred, backup, reachable.length, candidates.length, minutesAvailable),
  };
}

/**
 * Deterministic summary — the fallback text when Gemini is unavailable.
 */
function buildSummary(preferred, backup, reachableCount, totalCount, minutesAvailable) {
  const parts = [
    `Nearest donor is ${preferred.distanceKm} km out, roughly ${preferred.etaMinutes} minutes away`,
  ];

  if (backup) {
    parts.push(`next is ${backup.etaMinutes} minutes`);
  }

  if (minutesAvailable !== null) {
    if (reachableCount === 0) {
      parts.push("none can arrive before the deadline");
    } else if (reachableCount < totalCount) {
      parts.push(`${reachableCount} of ${totalCount} can make the deadline`);
    } else {
      parts.push("all candidates can make the deadline");
    }
  }

  return parts.join("; ") + ".";
}

module.exports = {
  coordinate,
  ETA_TIE_MINUTES,
};