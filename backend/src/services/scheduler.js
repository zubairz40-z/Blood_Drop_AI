/**
 * scheduler.js — Automatic notification expiry and wave-advancement scheduler.
 *
 * Periodically sweeps for expired MATCH_FOUND notifications and advances
 * each request to the next donor wave. Runs inside the Express process;
 * no separate worker needed.
 *
 * Safety:
 *   - single-execution guard prevents overlapping sweeps
 *   - errors are caught per-request so one failure cannot crash the sweep
 *   - already-processed notifications (read: true) are skipped by the query
 *   - idempotent: running twice for the same expiry is harmless
 */

const cron = require("node-cron");
const notificationService = require("./notificationService");
const matchingService = require("./matchingService");
const BloodRequest = require("../models/BloodRequest");
const Notification = require("../models/Notification");
const { STATUS } = require("../utils/requestStatus");

let task = null;
let running = false;

/**
 * Core sweep logic. Exported so tests can call it directly without
 * relying on real-time cron timing.
 */
async function sweep() {
  if (running) return [];
  running = true;

  const results = [];
  try {
    const expired = await notificationService.findExpiredMatches(new Date());

    // Group by request so we process each request at most once per sweep
    const byRequest = new Map();
    for (const n of expired) {
      if (!n.request || n.request.status !== STATUS.MATCHING) continue;
      const rid = String(n.request._id);
      if (!byRequest.has(rid)) byRequest.set(rid, []);
      byRequest.get(rid).push(n);
    }

    for (const [requestId, notifications] of byRequest) {
      try {
        const request = notifications[0].request;

        // Find which donors have already been notified for this request
        const priorNotifs = await Notification.find({
          request: request._id,
          type: "MATCH_FOUND",
        }).select("user wave");
        const notifiedDonorIds = new Set(priorNotifs.map(n => String(n.user)));
        const highestWave = Math.max(...priorNotifs.map(n => n.wave || 1));

        // Mark all expired notifications for this request as read
        for (const n of notifications) {
          n.read = true;
          n.readAt = new Date();
          await n.save();
        }

        // Get fresh candidates, excluding already-notified donors
        let candidates;
        try {
          const matchResult = await matchingService.findCandidates(requestId, {
            limit: 50,
            donorFilter: { "user": { $nin: Array.from(notifiedDonorIds).map(id => require("mongoose").Types.ObjectId.createFromHexString(id)) } },
          });
          candidates = matchResult.candidates || [];
        } catch {
          candidates = [];
        }

        // Find the first unnotified, eligible candidate
        let nextDonorId = null;
        for (const c of candidates) {
          if (!notifiedDonorIds.has(c.donorId)) {
            nextDonorId = c.donorId;
            break;
          }
        }

        if (nextDonorId) {
          // Contact the next donor at wave + 1
          const result = await require("./responseService").contactNextDonor({
            requestId: request._id,
            contactOrder: [nextDonorId],
            wave: highestWave + 1,
            actorId: request.hospital,
          });
          results.push({ requestId, ...result });
        } else {
          // No more candidates — request stays in MATCHING for manual review
          results.push({ requestId, contacted: null, exhausted: true, wave: highestWave + 1 });
        }
      } catch (err) {
        // Per-request error: log but do not crash the sweep
        results.push({ requestId, error: err.message });
      }
    }
  } finally {
    running = false;
  }

  return results;
}

/**
 * Start the scheduler. Safe to call multiple times — only one job runs.
 * @param {string} cronExpression — defaults to every minute
 */
function start(cronExpression = "* * * * *") {
  if (task) return;
  task = cron.schedule(cronExpression, async () => {
    try {
      await sweep();
    } catch (err) {
      // Scheduler-level error: log and continue. Never crash Express.
      console.error("[Scheduler] sweep error:", err.message);
    }
  });
  console.log("[Scheduler] Expiry sweep started (" + cronExpression + ")");
}

/** Stop the scheduler. Used during graceful shutdown and tests. */
function stop() {
  if (task) {
    task.stop();
    task = null;
  }
  running = false;
}

module.exports = { start, stop, sweep };
