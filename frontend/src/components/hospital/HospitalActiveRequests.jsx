import Card from '../ui/Card'
import Badge from '../ui/Badge'

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
}

const statusVariant = {
  MATCHING: 'info',
  'DONOR FOUND': 'success',
  'WAITING CONFIRMATION': 'warning',
  CONFIRMED: 'success',
  COMPLETED: 'success',
}

function HospitalActiveRequests({ requests = [] }) {
  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-text-dark mb-4">Active Blood Requests</h3>
      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blood-soft flex items-center justify-center">
                <span className="text-sm font-bold text-blood">{req.bloodGroup}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-text-dark">{req.id}</p>
                  <Badge variant={emergencyVariant[req.emergencyLevel] || 'neutral'}>
                    {req.emergencyLevel}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {req.donationType} · {req.units} {req.units === 1 ? 'unit' : 'units'} · {req.createdAt}
                </p>
              </div>
            </div>
            <Badge variant={statusVariant[req.status] || 'neutral'}>
              {req.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default HospitalActiveRequests
