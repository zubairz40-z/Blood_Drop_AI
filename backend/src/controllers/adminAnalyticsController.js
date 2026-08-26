/**
 * adminAnalyticsController.js — Admin analytics endpoint.
 */

const { getAnalytics } = require("../services/adminAnalyticsService");

/** GET /api/admin/analytics */
async function getAdminAnalytics(req, res, next) {
  try {
    const analytics = await getAnalytics();
    res.json({ success: true, analytics });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAdminAnalytics };
