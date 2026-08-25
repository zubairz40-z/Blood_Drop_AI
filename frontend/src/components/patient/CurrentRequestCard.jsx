import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

function CurrentRequestCard({ request }) {
  const navigate = useNavigate()
  if (!request) return null

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-dark">Current Request Status</h3>
          <p className="text-sm text-text-muted mt-0.5">{request.shortId}</p>
        </div>
        <Badge variant={request.statusVariant}>{request.statusLabel}</Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blood-soft flex items-center justify-center">
            <span className="text-sm font-bold text-blood">{request.bloodGroup}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-dark">{request.componentLabel}</p>
            <p className="text-xs text-text-muted">
              {request.unitsRequired} {request.unitsRequired === 1 ? 'unit' : 'units'}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Hospital</span>
            <span className="text-text-dark font-medium text-right max-w-[180px]">
              {request.hospital?.name || '—'}
            </span>
          </div>
          {request.location?.address && (
            <div className="flex justify-between text-sm items-center">
              <span className="text-text-muted">Location</span>
              <span className="text-text-dark font-medium flex items-center gap-1 text-right max-w-[180px]">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {request.location.address}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Urgency</span>
            <span className="text-text-dark font-medium">{request.urgencyLabel}</span>
          </div>
          {request.neededBy && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Needed By</span>
              <span className="text-text-dark">{request.neededBy.toLocaleString()}</span>
            </div>
          )}
          {request.createdAt && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Created</span>
              <span className="text-text-dark">{request.createdAt.toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate(`/patient/requests/${request.id}/tracking`)}
          >
            Track Request
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default CurrentRequestCard