import { Droplets, Building2, User, Star } from 'lucide-react'

function MapMarker({ x, y, type = 'request', label, sublabel, selected = false, onClick }) {
  const styles = {
    request: {
      bg: 'bg-blood',
      ring: selected ? 'ring-2 ring-blood ring-offset-2' : '',
      icon: Droplets,
      iconColor: 'text-white',
    },
    hospital: {
      bg: 'bg-brand',
      ring: selected ? 'ring-2 ring-brand ring-offset-2' : '',
      icon: Building2,
      iconColor: 'text-white',
    },
    donor: {
      bg: 'bg-blue-500',
      ring: selected ? 'ring-2 ring-blue-500 ring-offset-2' : '',
      icon: User,
      iconColor: 'text-white',
    },
    bestMatch: {
      bg: 'bg-emerald-500',
      ring: selected ? 'ring-2 ring-emerald-500 ring-offset-2' : '',
      icon: Star,
      iconColor: 'text-white',
    },
  }

  const s = styles[type] || styles.donor
  const Icon = s.icon

  return (
    <div
      className="absolute group"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <button
        onClick={onClick}
        aria-label={label}
        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full ${s.bg} ${s.ring} flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer z-10`}
      >
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.iconColor}`} />
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div className="bg-white rounded-lg shadow-elevated border border-border px-2.5 py-1.5 whitespace-nowrap">
          <p className="text-[10px] font-semibold text-text-dark">{label}</p>
          {sublabel && <p className="text-[9px] text-text-muted">{sublabel}</p>}
        </div>
      </div>
    </div>
  )
}

export default MapMarker
