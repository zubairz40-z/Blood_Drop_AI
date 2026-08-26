const matchingService = require("../services/matchingService");

/**
 * AI Agent #2 — Donor Matching Agent.
 *
 * Deliberately thin. The actual matching, filtering, scoring and ranking all
 * live in matchingService; this agent only makes a *coordination* decision on
 * top of that result: who to contact first, who to hold in reserve, and in
 * what order.
 *
 * That separation is the whole architecture. An agent that computed its own
 * candidate list could invent a donor, ignore a deferral, or drift out of sync
 * with the medical rules. This one cannot — it can only reorder and select
 * from a list the deterministic service produced.
 */

/** How many donors to hold as backups behind the primary. */
const DEFAULT_BACKUP_COUNT = 2;

/**
 * Score gap below which two candidates are treated as effectively equal.
 * Used to decide whether a choice was clear-cut or close, which the AI
 * Manager surfaces as confidence.
 */
const DECISIVE_MARGIN = 10;

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

/**
 * Picks a primary donor and an ordered list of backups for a request.
 *
 * @param {string} requestId
 * @param {object} options
 * @param {number} options.backupCount   How many reserves to name
 * @param {object} options.candidateSet  Pre-computed result from
 *   matchingService.findCandidates. Injectable so the AI Manager can run the
 *   funnel once and share it across agents rather than re-querying per agent.
 */
async function selectDonors(requestId, { backupCount = DEFAULT_BACKUP_COUNT, candidateSet, asOf = new Date() } = {}) {
  const result =
    candidateSet ?? (await matchingService.findCandidates(requestId, { asOf }));

  const candidates = result.candidates || [];

  if (candidates.length === 0) {
    return {
      requestId: String(requestId),
      primary: null,
      backups: [],
      contactOrder: [],
      decisive: false,
      reason: "No eligible donors were found within the search radius.",
    };
  }

  // findCandidates already sorted by score, then proximity. Re-sorting here
  // would risk diverging from that ordering, so we take it as given.
  const [best, ...rest] = candidates;
  const backups = rest.slice(0, backupCount);

  // A clear winner versus a near-tie. Not a medical judgement — just how
  // confident the ranking is, which the Manager reports to the hospital.
  const runnerUp = rest[0];
  const margin = runnerUp ? best.score - runnerUp.score : best.score;
  const decisive = !runnerUp || margin >= DECISIVE_MARGIN;

  return {
    requestId: String(requestId),
    primary: best.donorId,
    backups: backups.map((c) => c.donorId),

    // The full ordered list the notification layer should work through if
    // donors decline or time out.
    contactOrder: [best, ...backups].map((c) => c.donorId),

    decisive,
    margin,
    reason: buildReason(best, runnerUp, margin, decisive),

    // Carried through so downstream agents don't have to re-query
    candidateCount: candidates.length,
    radiusKm: result.radiusKm,
  };
}

/**
 * A short human-readable justification. Deterministic on purpose — this is
 * the fallback text if Gemini is unavailable, so the system can always
 * explain itself without an external API.
 */
function buildReason(best, runnerUp, margin, decisive) {
  const parts = [
    `${best.bloodGroup} donor ${best.distanceKm} km away, about ${best.etaMinutes} minutes out`,
  ];

  if (!runnerUp) {
    parts.push("the only eligible donor in range");
  } else if (decisive) {
    parts.push(`clearly ahead of the next candidate by ${margin} points`);
  } else {
    parts.push(`narrowly ahead of a comparable candidate by ${margin} points`);
  }

  return parts.join(" — ");
}

module.exports = {
  selectDonors,
  DECISIVE_MARGIN,
};