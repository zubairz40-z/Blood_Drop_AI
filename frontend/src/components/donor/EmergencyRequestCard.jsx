import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Badge from '../ui/Badge'
import { emergencyLevelConfig, statusConfig } from '../../data/demoDonorRequests'

function EmergencyRequestCard({ request }) {
  const navigate = useNavigate()
  const emergency = emergencyLevelConfig[request.emergencyLevel] || emergencyLevelConfig.NORMAL
  const status = statusConfig[request.status] || statusConfig.PENDING

  return (
    <button
      onClick={() => navigate(`/donor/requests/${request.id}`)}
      className="w-full flex items-center gap-4 p-4 bg-white border border-border rounded-xl hover:shadow-card transition-shadow text-left cursor-pointer"
    >
      <div className="w-12 h-12 rounded-xl bg-blood-soft flex items-center justify-center flex-shrink-0">
        <span className="text-lg font-bold text-blood">{request.bloodGroup}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-text-dark">{request.donationType}</span>
          <span className="text-xs text-text-muted">· {request.units} {request.units === 1 ? 'unit' : 'units'}</span>
          <Badge variant={emergency.variant}>{emergency.label}</Badge>
          {request.status !== 'PENDING' && (
            <Badge variant={status.variant}>{status.label}</Badge>
          )}
        </div>
        <p className="text-sm text-text-secondary mt-0.5 truncate">{request.hospital}</p>
        <p className="text-xs text-text-muted mt-0.5">{request.distance} km away · {request.requestedAt}</p>
      </div>

      <ChevronRight className="w-5 h-5 text-text-light flex-shrink-0" />
    </button>
  )
}

export default EmergencyRequestCard
