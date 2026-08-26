/**
 * routeService.js — Road-route lookup with Haversine fallback.
 *
 * Attempts OSRM (open-source) first, falls back to straight-line
 * distance and estimated ETA when the provider is unavailable.
 *
 * All routing is server-side only — the frontend never calls the
 * routing provider directly.
 */

const { haversineDistance } = require("../utils/geoValidation");

const OSRM_BASE = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";
const ASSUMED_SPEED_KMH = 25;

/**
 * Request a road route between two points.
 *
 * @param {[number, number]} origin — [lng, lat]
 * @param {[number, number]} destination — [lng, lat]
 * @returns {object} { distanceKm, durationMinutes, routeAvailable, geometry }
 */
async function getRoute(origin, destination) {
  if (!Array.isArray(origin) || !Array.isArray(destination)) {
    return fallbackRoute(origin, destination);
  }

  try {
    const url = `${OSRM_BASE}/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error("OSRM HTTP " + res.status);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) throw new Error("No route found");

    const route = data.routes[0];
    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMinutes: Math.round(route.duration / 60),
      routeAvailable: true,
      geometry: route.geometry || null,
      provider: "osrm",
    };
  } catch {
    return fallbackRoute(origin, destination);
  }
}

/**
 * Haversine fallback when no routing provider is available.
 */
function fallbackRoute(origin, destination) {
  if (!origin || !destination) {
    return { distanceKm: 0, durationMinutes: 0, routeAvailable: false, geometry: null, provider: "haversine" };
  }
  const dist = haversineDistance(
    origin[1], origin[0],
    destination[1], destination[0]
  );
  return {
    distanceKm: dist,
    durationMinutes: Math.round((dist / ASSUMED_SPEED_KMH) * 60),
    routeAvailable: false,
    geometry: null,
    provider: "haversine",
  };
}

module.exports = { getRoute, fallbackRoute };
