import { ChevronRight } from 'lucide-react'
import Badge from '../ui/Badge'

const emergencyConfig = {
  CRITICAL: { label: 'CRITICAL', variant: 'error' },
  URGENT: { label: 'URGENT', variant: 'warning' },
  NORMAL: { label: 'NORMAL', variant: 'info' },
}

function NearbyRequestCard({ request }) {
  const emergency = emergencyConfig[request.emergency] || emergencyConfig.NORMAL

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl hover:shadow-card transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-blood-soft flex items-center justify-center flex-shrink-0">
        <span className="text-lg font-bold text-blood">{request.bloodGroup}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-text-dark">{request.donationType}</span>
          <Badge variant={emergency.variant}>{emergency.label}</Badge>
        </div>
        <p className="text-sm text-text-secondary mt-0.5 truncate">{request.hospital}</p>
        <p className="text-xs text-text-muted mt-0.5">{request.distance} km away</p>
      </div>

      <button className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover transition-colors cursor-pointer flex-shrink-0">
        View Request
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default NearbyRequestCard
