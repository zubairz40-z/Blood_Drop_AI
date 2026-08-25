import Card from '../ui/Card'
import Badge from '../ui/Badge'

function HospitalActiveRequests({ requests = [] }) {
  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-text-dark mb-4">Active Blood Requests</h3>
      {requests.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">No active requests</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blood-soft flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blood">{req.bloodGroup}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-dark">{req.shortId}</p>
                    <Badge
                      variant={
                        req.urgency === 'EMERGENCY'
                          ? 'error'
                          : req.urgency === 'URGENT'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {req.urgencyLabel}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {req.componentLabel} · {req.unitsRequired}{' '}
                    {req.unitsRequired === 1 ? 'unit' : 'units'}
                  </p>
                </div>
              </div>
              <Badge variant={req.statusVariant}>{req.statusLabel}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default HospitalActiveRequests