/**
 * Coordinate normalization utilities.
 *
 * MongoDB GeoJSON is always: { type: "Point", coordinates: [longitude, latitude] }
 * MapLibre also expects: [longitude, latitude]
 * The frontend forms use: { latitude, longitude }
 *
 * This module provides a single consistent output shape: { lat, lng }
 * and explicit helpers for GeoJSON conversion.
 */

export function geoJsonToLngLat(point) {
  if (!point || point.type !== 'Point' || !Array.isArray(point.coordinates) || point.coordinates.length !== 2) {
    return null
  }

  const [lng, lat] = point.coordinates.map(Number)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) {
    return null
  }

  return [lng, lat]
}

export function normalizeCoordinates(input) {
  if (!input) return null

  if (Array.isArray(input)) {
    if (input.length !== 2) return null
    const [lng, lat] = input.map(Number)
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) return null
    return { lat, lng }
  }

  if (typeof input === 'object') {
    if (input.type === 'Point' && Array.isArray(input.coordinates)) {
      const [lng, lat] = input.coordinates.map(Number)
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) return null
      return { lat, lng }
    }

    const lat = Number(input.latitude ?? input.lat)
    const lng = Number(input.longitude ?? input.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) return null
    return { lat, lng }
  }

  return null
}

export function isWithinBangladesh(lat, lng) {
  return lat >= 20.5 && lat <= 26.7 && lng >= 88.0 && lng <= 92.7
}

export const DHAKA_CENTER = { lat: 23.8103, lng: 90.4125 }

export function toMapLibreLngLat(input) {
  const c = normalizeCoordinates(input)
  if (!c) return null
  return [c.lng, c.lat]
}

export function toLeafletLatLng(input) {
  const c = normalizeCoordinates(input)
  if (!c) return null
  return [c.lat, c.lng]
}

export async function geocodeAddress(address) {
  const query = String(address || '').trim()
  if (!query) throw new Error('Enter an address first.')

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=bd&q=${encodeURIComponent(query)}`,
  )
  if (!response.ok) throw new Error('Location search is temporarily unavailable.')

  const results = await response.json()
  const result = results[0]
  const lat = Number(result?.lat)
  const lng = Number(result?.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    throw new Error('Location not found. Choose a more specific Bangladesh area.')
  }

  return { latitude: lat, longitude: lng, address: query }
}
