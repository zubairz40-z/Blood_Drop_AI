/**
 * routeRoutes.js — Road routing API endpoint.
 *
 * POST /api/route — returns road-route GeoJSON between two points.
 * Uses OSRM via routeService.js with Haversine fallback.
 */

const express = require("express");
const router = express.Router();
const { getRoute, fallbackRoute } = require("../services/routeService");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

router.post("/", verifyFirebaseToken, async (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !Array.isArray(origin) || origin.length !== 2) {
      return res.status(400).json({ success: false, message: "origin must be [lng, lat]" });
    }
    if (!destination || !Array.isArray(destination) || destination.length !== 2) {
      return res.status(400).json({ success: false, message: "destination must be [lng, lat]" });
    }

    const [ox, oy] = origin.map(Number);
    const [dx, dy] = destination.map(Number);
    if (!Number.isFinite(ox) || !Number.isFinite(oy) || !Number.isFinite(dx) || !Number.isFinite(dy)) {
      return res.status(400).json({ success: false, message: "Coordinates must be numbers" });
    }

    let result;
    try {
      result = await getRoute([ox, oy], [dx, dy]);
    } catch {
      result = fallbackRoute([ox, oy], [dx, dy]);
    }

    res.json({ success: true, route: result });
  } catch (err) {
    console.error("Route API error:", err.message);
    res.status(500).json({ success: false, message: "Routing failed" });
  }
});

module.exports = router;
