/**
 * AI Controller — exposes the AI Orchestrator through a minimal REST endpoint.
 *
 * Matching, eligibility, and geo results are currently sent by the frontend
 * as temporary structured input. This allows the frontend to display real
 * orchestrator output while Arefa's real agents are built independently.
 *
 * Later integration will replace these client-supplied inputs with
 * server-side agent calls without changing the frontend output contract.
 */

const { coordinateRequest } = require("../services/aiOrchestrator");

/**
 * POST /api/ai/coordinate
 *
 * Runs the AI Orchestrator on the supplied data and returns the
 * deterministic coordination result. No database writes, no LLM calls.
 */
async function coordinateBloodRequest(req, res, next) {
  try {
    const {
      request,
      matchingResult,
      eligibilityResult,
      geoResult,
      riskContext,
    } = req.body || {};

    if (!request || !request.id) {
      return res.status(400).json({
        success: false,
        message: "A valid request object with an id is required.",
      });
    }

    const result = coordinateRequest({
      request,
      matchingResult: matchingResult || null,
      eligibilityResult: eligibilityResult || null,
      geoResult: geoResult || null,
      riskContext: riskContext || null,
    });

    return res.status(200).json({ success: true, result });
  } catch (err) {
    return next(err);
  }
}

module.exports = { coordinateBloodRequest };
