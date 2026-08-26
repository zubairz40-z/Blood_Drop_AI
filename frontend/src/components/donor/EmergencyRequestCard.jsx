import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { useCountdown } from '../../hooks/useCountdown'

const urgencyVariant = {
  EMERGENCY: 'error',
  ROUTINE: 'info',
}

function EmergencyRequestCard({ request, onAccept, onDecline, responding }) {
  const navigate = useNavigate()
  const { formatted: countdown, expired } = useCountdown(request.expiresAt)
  const urgency = urgencyVariant[request.urgency] || 'neutral'
  const isActionable = request.expiresAt && !expired && !request.responded

  return (
    <div className="p-4 bg-white border border-border rounded-xl hover:shadow-card transition-shadow">
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => navigate(`/donor/requests/${request.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') navigate(`/donor/requests/${request.id}`)
        }}
      >
        <div className="w-12 h-12 rounded-xl bg-blood-soft flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-blood">{request.bloodGroup}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-dark">{request.component}</span>
            <span className="text-xs text-text-muted">· {request.units} {request.units === 1 ? 'unit' : 'units'}</span>
            <Badge variant={urgency}>{request.urgency}</Badge>
            {request.wave != null && (
              <Badge variant="error">Wave {request.wave}</Badge>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-0.5 truncate">{request.hospitalName}</p>

          {request.distanceKm != null && (
            <p className="text-xs text-text-muted mt-0.5">
              {request.distanceKm} km away · ~{request.etaMinutes} min ETA
            </p>
          )}

          {request.expiresAt && (
            <div className="mt-1.5">
              {expired ? (
                <span className="text-[11px] font-medium text-text-muted">Offer expired</span>
              ) : (
                <span className="text-[11px] font-mono font-medium text-amber-600">
                  Respond within {countdown}
                </span>
              )}
            </div>
          )}
        </div>

        {!request.expiresAt && (
          <ChevronRight className="w-5 h-5 text-text-light flex-shrink-0" />
        )}
      </div>

      {isActionable && (
        <div className="flex gap-3 mt-3 pt-3 border-t border-border">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onDecline?.(request.id) }}
            disabled={responding}
            className="flex-1"
          >
            Decline
          </Button>
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); onAccept?.(request.id) }}
            disabled={responding}
            loading={responding}
            className="flex-1"
          >
            Accept
          </Button>
        </div>
      )}

      {request.responded && (
        <div className="mt-3 pt-3 border-t border-border">
          <Badge variant={request.responded === 'ACCEPT' ? 'success' : 'warning'}>
            {request.responded === 'ACCEPT' ? 'You accepted' : 'You declined'}
          </Badge>
        </div>
      )}
    </div>
  )
}

export default EmergencyRequestCard
