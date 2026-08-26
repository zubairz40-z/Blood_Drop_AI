/**
 * Coordinate normalization utilities.
 *
 * The backend stores GeoJSON: { type: "Point", coordinates: [longitude, latitude] }
 * Leaflet expects: [latitude, longitude]
 * The frontend forms use: { latitude, longitude }
 *
 * This module provides a single consistent output shape: { lat, lng }
 * with validation.
 */

/**
 * Normalizes any supported coordinate format into { lat, lng }.
 *
 * Accepts:
 *   - GeoJSON: { type: "Point", coordinates: [lng, lat] }
 *   - Flat:    { latitude, longitude } or { lat, lng }
 *   - Array:   [lat, lng] or [lng, lat] (with auto-detection for Bangladesh bounds)
 *
 * Returns null if input is missing, invalid, or outside valid ranges.
 */
export function normalizeCoordinates(input) {
  if (!input || typeof input !== 'object' && !Array.isArray(input)) return null

  // Array format: [lat, lng] or [lng, lat]
  if (Array.isArray(input)) {
    if (input.length !== 2) return null
    const [a, b] = input.map(Number)
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null

    // Auto-detect: if first value is in Bangladesh longitude range (88-93)
    // and second is in latitude range (20-27), assume [lng, lat] (GeoJSON)
    if (a >= 88 && a <= 93 && b >= 20 && b <= 27) {
      return { lat: b, lng: a }
    }
    // Otherwise assume [lat, lng]
    return { lat: a, lng: b }
  }

  // GeoJSON format: { type: "Point", coordinates: [lng, lat] }
  if (input.coordinates && Array.isArray(input.coordinates)) {
    const [lng, lat] = input.coordinates.map(Number)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
    return { lat, lng }
  }

  // Flat format: { latitude, longitude } or { lat, lng }
  const lat = Number(input.latitude ?? input.lat)
  const lng = Number(input.longitude ?? input.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null

  return { lat, lng }
}

/**
 * Returns true if the coordinate is within Bangladesh's approximate bounds.
 * Useful for defaulting the map center.
 */
export function isWithinBangladesh(lat, lng) {
  return lat >= 20.5 && lat <= 26.7 && lng >= 88.0 && lng <= 92.7
}

/** Default center: Dhaka, Bangladesh */
export const DHAKA_CENTER = { lat: 23.8103, lng: 90.4125 }

/**
 * Converts any supported coordinate format to [lng, lat] for MapLibre.
 * MapLibre uses the same order as GeoJSON: longitude first.
 */
export function toMapLibreLngLat(input) {
  const c = normalizeCoordinates(input)
  if (!c) return null
  return [c.lng, c.lat]
}

/**
 * Converts any supported coordinate format to [lat, lng] for legacy use.
 */
export function toLeafletLatLng(input) {
  const c = normalizeCoordinates(input)
  if (!c) return null
  return [c.lat, c.lng]
}
