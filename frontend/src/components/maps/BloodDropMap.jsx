import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { normalizeCoordinates, DHAKA_CENTER } from '../../utils/locationUtils'
import MapLegend from './MapLegend'

/**
 * Fix Leaflet default marker icon paths (Vite/webpack strips the assets).
 */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/**
 * Custom colored markers for different entity types.
 */
const MARKER_ICONS = {
  request: L.divIcon({
    className: '',
    html: '<div style="width:28px;height:28px;border-radius:50%;background:#DC2626;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  }),
  hospital: L.divIcon({
    className: '',
    html: '<div style="width:28px;height:28px;border-radius:50%;background:#F72585;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M9 8h1"/><path d="M9 12h1"/><path d="M9 16h1"/><path d="M14 8h1"/><path d="M14 12h1"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  }),
  donor: L.divIcon({
    className: '',
    html: '<div style="width:26px;height:26px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -15],
  }),
  bestMatch: L.divIcon({
    className: '',
    html: '<div style="width:30px;height:30px;border-radius:50%;background:#10B981;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -17],
  }),
}

/**
 * Internal component that auto-fits the map to show all markers.
 */
function FitBounds({ markers }) {
  const map = useMap()

  useEffect(() => {
    if (markers.length === 0) return

    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14)
      return
    }

    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [map, markers])

  return null
}

/**
 * BloodDropMap — real Leaflet/OpenStreetMap component.
 *
 * @param {object} props
 * @param {Array}  props.markers     — array of { lat, lng, type, label, sublabel }
 * @param {string} [props.height]    — CSS height (default: 350px)
 * @param {string} [props.className] — additional CSS classes
 */
function BloodDropMap({ markers = [], height = '350px', className = '' }) {
  const mapRef = useRef(null)

  // Normalize all markers and filter out invalid ones
  const validMarkers = markers
    .map((m) => {
      const coords = normalizeCoordinates(m)
      if (!coords) return null
      return { ...coords, type: m.type || 'donor', label: m.label || '', sublabel: m.sublabel || '' }
    })
    .filter(Boolean)

  // No valid coordinates — show fallback
  if (validMarkers.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-50 rounded-2xl border border-border ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-text-muted text-center px-4">
          Location coordinates are not available for this view.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className="rounded-2xl border border-border overflow-hidden"
        style={{ height }}
      >
        <MapContainer
          ref={mapRef}
          center={[DHAKA_CENTER.lat, DHAKA_CENTER.lng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          attributionControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds markers={validMarkers} />

          {validMarkers.map((m, idx) => (
            <Marker
              key={`${m.type}-${idx}`}
              position={[m.lat, m.lng]}
              icon={MARKER_ICONS[m.type] || MARKER_ICONS.donor}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{m.label}</p>
                  {m.sublabel && <p className="text-xs text-gray-500">{m.sublabel}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <MapLegend />
    </div>
  )
}

export default BloodDropMap
