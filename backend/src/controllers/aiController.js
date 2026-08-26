/**
 * AI Controller — exposes the AI Orchestrator through a minimal REST endpoint.
 *
 * POST /api/ai/coordinate
 *
 * Accepts either:
 *   { requestId }                    — real server-side flow (calls all 5 agents)
 *   { request, matchingResult, ... } — legacy injected-input flow (tests, compat)
 */

const { coordinateRequest, coordinateRealRequest } = require("../services/aiOrchestrator");

/**
 * POST /api/ai/coordinate
 *
 * If the body contains `requestId`, runs the full real-agent pipeline.
 * Otherwise falls back to the injected-input path for backward compat.
 */
async function coordinateBloodRequest(req, res, next) {
  try {
    const body = req.body || {};

    // --- New path: real server-side agents ---
    if (body.requestId) {
      const result = await coordinateRealRequest({ requestId: body.requestId });
      return res.status(200).json({ success: true, result });
    }

    // --- Legacy path: client-injected inputs ---
    const { request, matchingResult, eligibilityResult, geoResult, riskContext } = body;

    if (!request || !request.id) {
      return res.status(400).json({
        success: false,
        message: "A valid requestId or request object with an id is required.",
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
