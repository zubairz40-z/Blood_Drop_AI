import MapMarker from './MapMarker'
import MapLegend from './MapLegend'

function BloodDropMap({ data, selectedDonorId, onSelectDonor }) {
  if (!data) return null

  const { request, hospital, donors, searchRadius } = data

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-neutral-50 rounded-2xl border border-border overflow-hidden">
        {/* Background grid / roads */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Subtle grid */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e5e5" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Road lines */}
          <line x1="10" y1="30" x2="90" y2="30" stroke="#d4d4d4" strokeWidth="0.5" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="#d4d4d4" strokeWidth="0.5" />
          <line x1="10" y1="70" x2="90" y2="70" stroke="#d4d4d4" strokeWidth="0.5" />
          <line x1="25" y1="10" x2="25" y2="90" stroke="#d4d4d4" strokeWidth="0.5" />
          <line x1="50" y1="10" x2="50" y2="90" stroke="#d4d4d4" strokeWidth="0.5" />
          <line x1="75" y1="10" x2="75" y2="90" stroke="#d4d4d4" strokeWidth="0.5" />

          {/* Diagonal road */}
          <line x1="15" y1="75" x2="85" y2="20" stroke="#d4d4d4" strokeWidth="0.4" strokeDasharray="2,1" />

          {/* Neighborhood labels */}
          <text x="18" y="45" fontSize="2.2" fill="#a3a3a3" fontFamily="sans-serif">Mirpur</text>
          <text x="55" y="35" fontSize="2.2" fill="#a3a3a3" fontFamily="sans-serif">Dhanmondi</text>
          <text x="70" y="70" fontSize="2.2" fill="#a3a3a3" fontFamily="sans-serif">Gulshan</text>
        </svg>

        {/* Search radius */}
        {searchRadius && (
          <div
            className="absolute rounded-full border-2 border-dashed border-brand/20 bg-brand/5"
            style={{
              left: `${searchRadius.centerX}%`,
              top: `${searchRadius.centerY}%`,
              width: `${searchRadius.radiusPercent * 2}%`,
              height: `${searchRadius.radiusPercent * 2}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-text-muted whitespace-nowrap">
              Demo search area
            </span>
          </div>
        )}

        {/* Connection line: request to best match donor */}
        {donors?.find((d) => d.status === 'BEST_MATCH') && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line
              x1={`${request.x}%`}
              y1={`${request.y}%`}
              x2={`${donors.find((d) => d.status === 'BEST_MATCH').x}%`}
              y2={`${donors.find((d) => d.status === 'BEST_MATCH').y}%`}
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="4,3"
              opacity="0.5"
            />
          </svg>
        )}

        {/* Markers */}
        <MapMarker
          x={request.x}
          y={request.y}
          type="request"
          label={request.label}
          sublabel={request.area}
        />

        <MapMarker
          x={hospital.x}
          y={hospital.y}
          type="hospital"
          label={hospital.name}
          sublabel={hospital.area}
        />

        {donors?.map((donor) => (
          <MapMarker
            key={donor.id}
            x={donor.x}
            y={donor.y}
            type={donor.status === 'BEST_MATCH' ? 'bestMatch' : 'donor'}
            label={`${donor.id} — ${donor.bloodGroup}`}
            sublabel={`~${donor.distance} km · ${donor.availability}`}
            selected={selectedDonorId === donor.id}
            onClick={() => onSelectDonor?.(donor.id)}
          />
        ))}
      </div>

      <MapLegend />
    </div>
  )
}

export default BloodDropMap
