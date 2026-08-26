/**
 * AI Controller — exposes the AI Orchestrator through a minimal REST endpoint.
 *
 * POST /api/ai/coordinate
 *
 * Accepts: { requestId }
 * Runs the full real-agent pipeline server-side.
 *
 * Authorization:
 *   - Patient: can only coordinate requests they own (patient field matches)
 *   - Hospital: can coordinate requests assigned to their hospital
 *   - Admin: can coordinate any request
 */

const BloodRequest = require("../models/BloodRequest");
const { coordinateRealRequest } = require("../services/aiOrchestrator");

/**
 * POST /api/ai/coordinate
 *
 * Runs the full five-agent pipeline for a blood request.
 */
async function coordinateBloodRequest(req, res, next) {
  try {
    const { requestId } = req.body || {};

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "requestId is required.",
      });
    }

    // Ownership check: patients may only coordinate their own requests
    if (req.currentUser.role === "patient") {
      const request = await BloodRequest.findById(requestId).select("patient").lean();
      if (!request) {
        return res.status(404).json({ success: false, message: "Request not found." });
      }
      if (String(request.patient) !== String(req.currentUser._id)) {
        return res.status(403).json({
          success: false,
          message: "You can only coordinate your own requests.",
        });
      }
    }

    const result = await coordinateRealRequest({ requestId });
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return next(err);
  }
}

module.exports = { coordinateBloodRequest };
