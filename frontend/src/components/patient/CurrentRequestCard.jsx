import { useNavigate } from 'react-router-dom'
import { MapPin, Sparkles } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
}

const statusVariant = {
  PENDING: 'neutral',
  MATCHING: 'info',
  'DONOR FOUND': 'success',
  'WAITING RESPONSE': 'warning',
  CONFIRMED: 'success',
  COMPLETED: 'success',
}

function CurrentRequestCard({ request }) {
  const navigate = useNavigate()
  if (!request) return null

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-dark">Current Request Status</h3>
          <p className="text-sm text-text-muted mt-0.5">{request.id}</p>
        </div>
        <Badge variant={emergencyVariant[request.emergencyLevel] || 'neutral'}>
          {request.emergencyLevel}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blood-soft flex items-center justify-center">
            <span className="text-sm font-bold text-blood">{request.bloodGroup}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-dark">{request.donationType}</p>
            <p className="text-xs text-text-muted">{request.units} {request.units === 1 ? 'unit' : 'units'}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Hospital</span>
            <span className="text-text-dark font-medium">{request.hospital}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-text-muted">Location</span>
            <span className="text-text-dark font-medium flex items-center gap-1 text-right max-w-[180px]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {request.location}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Status</span>
            <Badge variant={statusVariant[request.status] || 'neutral'}>{request.status}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Created</span>
            <span className="text-text-dark">{request.createdAt}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/patient/requests/${request.id}/tracking`)}
          >
            Track Request
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Sparkles}
            className="flex-1"
            onClick={() => navigate(`/patient/requests/${request.id}/coordination`)}
          >
            AI Coordination
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default CurrentRequestCard
