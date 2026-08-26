import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { normalizeCoordinates, DHAKA_CENTER, geoJsonToLngLat } from '../../utils/locationUtils'
import MapLegend from './MapLegend'

const MAP_STYLE = import.meta.env.VITE_MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`
  : {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    }

const MARKER_COLORS = {
  request: '#DC2626',
  hospital: '#F72585',
  donor: '#3B82F6',
  bestMatch: '#10B981',
}

const MARKER_SVG = {
  request: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  hospital: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M9 8h1"/><path d="M9 12h1"/><path d="M9 16h1"/><path d="M14 8h1"/><path d="M14 12h1"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>`,
  donor: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  bestMatch: `<svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
}

const MARKER_SIZES = {
  request: 28,
  hospital: 28,
  donor: 26,
  bestMatch: 30,
}

function createMarkerElement(type) {
  const color = MARKER_COLORS[type] || MARKER_COLORS.donor
  const size = MARKER_SIZES[type] || 26
  const svg = MARKER_SVG[type] || MARKER_SVG.donor
  const el = document.createElement('div')
  el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;`
  el.innerHTML = svg
  return el
}

function BloodDropMap({ markers = [], route = null, height = '350px', className = '' }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [mapError, setMapError] = useState(false)

  const validMarkers = markers
    .map((marker) => {
      const coords = normalizeCoordinates(marker?.location ?? marker?.coordinates ?? marker)
      if (!coords) return null
      return { ...coords, type: marker?.type || 'donor', label: marker?.label || marker?.name || 'Location', sublabel: marker?.sublabel || marker?.details || '' }
    })
    .filter(Boolean)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [DHAKA_CENTER.lng, DHAKA_CENTER.lat],
      zoom: 11,
      attributionControl: true,
    })

    map.on('error', () => setMapError(true))
    map.on('load', () => setMapError(false))
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    if (validMarkers.length === 0) {
      map.flyTo({ center: [DHAKA_CENTER.lng, DHAKA_CENTER.lat], zoom: 11, duration: 250 })
      return
    }

    const bounds = new maplibregl.LngLatBounds()

    validMarkers.forEach((marker) => {
      const popup = new maplibregl.Popup({ offset: 16 }).setHTML(
        `<div style="font-size:14px;"><strong>${marker.label}</strong>${marker.sublabel ? `<br/><span style="font-size:12px;color:#666;">${marker.sublabel}</span>` : ''}</div>`
      )

      const pointMarker = new maplibregl.Marker({ element: createMarkerElement(marker.type) })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.push(pointMarker)
      bounds.extend([marker.lng, marker.lat])
    })

    if (validMarkers.length === 1) {
      map.flyTo({ center: [validMarkers[0].lng, validMarkers[0].lat], zoom: 14, duration: 250 })
    } else {
      map.fitBounds(bounds, { padding: 70, maxZoom: 15, duration: 250 })
    }
  }, [validMarkers])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (map.getLayer('route-line')) map.removeLayer('route-line')
    if (map.getSource('route')) map.removeSource('route')

    if (!route || !route.coordinates || route.coordinates.length < 2) return

    const routeCoords = route.coordinates.map((coord) => {
      if (coord && typeof coord === 'object' && coord.type === 'Point' && Array.isArray(coord.coordinates)) {
        const lngLat = geoJsonToLngLat(coord)
        return lngLat || null
      }

      if (Array.isArray(coord) && coord.length >= 2) {
        const [lng, lat] = coord.map(Number)
        if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat]
      }

      const normalized = normalizeCoordinates(coord)
      if (!normalized) return null
      return [normalized.lng, normalized.lat]
    }).filter(Boolean)

    if (!routeCoords.length) return

    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: routeCoords },
        properties: {},
      },
    })

    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#2563eb', 'line-width': 4, 'line-opacity': 0.9 },
    })
  }, [route])

  useEffect(() => {
    if (mapRef.current && containerRef.current) {
      setTimeout(() => mapRef.current.resize(), 100)
    }
  }, [height])

  if (validMarkers.length === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div
          className="flex items-center justify-center bg-neutral-50 rounded-2xl border border-border"
          style={{ height }}
        >
          <p className="text-sm text-text-muted text-center px-4">
            Location coordinates are not available for this view.
          </p>
        </div>
        {mapError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Map tiles are temporarily unavailable.
          </div>
        )}
        <MapLegend />
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className="rounded-2xl border border-border overflow-hidden"
        style={{ height }}
      >
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
      {mapError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Map tiles are temporarily unavailable.
        </div>
      )}
      <MapLegend />
    </div>
  )
}

export default BloodDropMap
