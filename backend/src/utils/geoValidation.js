/**
 * Geo Validation Utilities — canonical coordinate validation for BloodDrop.
 *
 * Backend/MongoDB uses GeoJSON: { type: "Point", coordinates: [longitude, latitude] }
 * Leaflet uses: [latitude, longitude]
 * Frontend forms use: { latitude, longitude }
 *
 * This module provides validation, normalization, and distance calculation.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Loose Bangladesh bounds for seed integrity checks only. */
const BANGLADESH_BOUNDS = { latMin: 20.5, latMax: 26.7, lngMin: 88.0, lngMax: 92.7 };

/** Dhaka city center — default map fallback. */
const DHAKA_CENTER = { lat: 23.8103, lng: 90.4125 };

/** Earth radius in kilometers for Haversine calculation. */
const EARTH_RADIUS_KM = 6371;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Checks if a longitude value is within valid range (-180 to 180).
 * @param {number} lng
 * @returns {boolean}
 */
function isValidLongitude(lng) {
  return typeof lng === "number" && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

/**
 * Checks if a latitude value is within valid range (-90 to 90).
 * @param {number} lat
 * @returns {boolean}
 */
function isValidLatitude(lat) {
  return typeof lat === "number" && Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validates a GeoJSON Point object.
 * Returns { valid: true, lng, lat } or { valid: false, reason }.
 *
 * @param {object} location — expected shape { type: "Point", coordinates: [lng, lat] }
 * @returns {{ valid: boolean, lng?: number, lat?: number, reason?: string }}
 */
function validateGeoJsonPoint(location) {
  if (!location || typeof location !== "object") {
    return { valid: false, reason: "Location is missing or not an object." };
  }

  if (location.type !== "Point") {
    return { valid: false, reason: `Location type must be "Point", got "${location.type}".` };
  }

  if (!Array.isArray(location.coordinates)) {
    return { valid: false, reason: "Location coordinates must be an array." };
  }

  if (location.coordinates.length !== 2) {
    return { valid: false, reason: `Location coordinates must have exactly 2 elements, got ${location.coordinates.length}.` };
  }

  const [lng, lat] = location.coordinates;

  if (!isValidLongitude(lng)) {
    return { valid: false, reason: `Invalid longitude: ${lng}. Must be -180 to 180.` };
  }

  if (!isValidLatitude(lat)) {
    return { valid: false, reason: `Invalid latitude: ${lat}. Must be -90 to 90.` };
  }

  return { valid: true, lng, lat };
}

/**
 * Validates that coordinates fall within Bangladesh bounds (loose check for seed data).
 * @param {number} lng
 * @param {number} lat
 * @returns {boolean}
 */
function isWithinBangladesh(lng, lat) {
  return (
    isValidLongitude(lng) &&
    isValidLatitude(lat) &&
    lng >= BANGLADESH_BOUNDS.lngMin &&
    lng <= BANGLADESH_BOUNDS.lngMax &&
    lat >= BANGLADESH_BOUNDS.latMin &&
    lat <= BANGLADESH_BOUNDS.latMax
  );
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes various coordinate input formats into GeoJSON Point.
 *
 * Accepts:
 * - { type: "Point", coordinates: [lng, lat] } — pass through
 * - { latitude, longitude } or { lat, lng } — convert to GeoJSON
 * - [lng, lat] or [lat, lng] — auto-detect for Bangladesh, convert
 *
 * @param {object|Array} input
 * @returns {{ type: "Point", coordinates: [number, number] } | null}
 */
function toGeoJson(input) {
  if (!input) return null;

  // Already GeoJSON
  if (input.type === "Point" && Array.isArray(input.coordinates) && input.coordinates.length === 2) {
    const [lng, lat] = input.coordinates;
    if (isValidLongitude(lng) && isValidLatitude(lat)) {
      return { type: "Point", coordinates: [lng, lat] };
    }
    return null;
  }

  // Object with named fields
  if (typeof input === "object" && !Array.isArray(input)) {
    if (input.latitude != null && input.longitude != null) {
      const lat = Number(input.latitude);
      const lng = Number(input.longitude);
      if (isValidLongitude(lng) && isValidLatitude(lat)) {
        return { type: "Point", coordinates: [lng, lat] };
      }
    }
    if (input.lat != null && input.lng != null) {
      const lat = Number(input.lat);
      const lng = Number(input.lng);
      if (isValidLongitude(lng) && isValidLatitude(lat)) {
        return { type: "Point", coordinates: [lng, lat] };
      }
    }
    return null;
  }

  // Array: [a, b]
  if (Array.isArray(input) && input.length === 2) {
    const [a, b] = input.map(Number);
    if (!isValidLongitude(a) || !isValidLatitude(b)) return null;

    // Auto-detect: if both values fall in Bangladesh bounds, assume [lng, lat] (GeoJSON order)
    if (isWithinBangladesh(a, b)) {
      return { type: "Point", coordinates: [a, b] };
    }
    // Fallback: assume [lat, lng] (Leaflet order)
    return { type: "Point", coordinates: [b, a] };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Distance calculation (Haversine)
// ---------------------------------------------------------------------------

/**
 * Calculates the great-circle distance between two points using the Haversine formula.
 *
 * @param {number} lng1 — longitude of point 1
 * @param {number} lat1 — latitude of point 1
 * @param {number} lng2 — longitude of point 2
 * @param {number} lat2 — latitude of point 2
 * @returns {number} distance in kilometers, rounded to 1 decimal
 */
function haversineDistance(lng1, lat1, lng2, lat2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

/**
 * Generates a deterministic nearby point around a center.
 * Uses a seeded pseudo-random number generator for reproducibility.
 *
 * @param {number} centerLng — center longitude
 * @param {number} centerLat — center latitude
 * @param {number} minKm — minimum distance from center
 * @param {number} maxKm — maximum distance from center
 * @param {number} seed — deterministic seed value
 * @returns {{ lng: number, lat: number }}
 */
function generateNearbyPoint(centerLng, centerLat, minKm, maxKm, seed) {
  // Deterministic pseudo-random using a simple LCG (Linear Congruential Generator)
  let s = seed;
  const nextRandom = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  const angle = nextRandom() * 2 * Math.PI;
  // Random distance between minKm and maxKm
  const distKm = minKm + nextRandom() * (maxKm - minKm);

  // Convert distance to degree offsets (approximate)
  const latOffset = (distKm * Math.cos(angle)) / 111.32;
  const lngOffset = (distKm * Math.sin(angle)) / (111.32 * Math.cos((centerLat * Math.PI) / 180));

  return {
    lng: Math.round((centerLng + lngOffset) * 10000) / 10000,
    lat: Math.round((centerLat + latOffset) * 10000) / 10000,
  };
}

/**
 * Calculates distance between two GeoJSON Points.
 * @param {object} point1 — { type: "Point", coordinates: [lng, lat] }
 * @param {object} point2 — { type: "Point", coordinates: [lng, lat] }
 * @returns {number | null} distance in km, or null if inputs invalid
 */
function geoJsonDistance(point1, point2) {
  const v1 = validateGeoJsonPoint(point1);
  const v2 = validateGeoJsonPoint(point2);
  if (!v1.valid || !v2.valid) return null;
  return haversineDistance(v1.lng, v1.lat, v2.lng, v2.lat);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  BANGLADESH_BOUNDS,
  DHAKA_CENTER,
  EARTH_RADIUS_KM,
  isValidLongitude,
  isValidLatitude,
  validateGeoJsonPoint,
  isWithinBangladesh,
  toGeoJson,
  haversineDistance,
  generateNearbyPoint,
  geoJsonDistance,
};
