import Card from '../ui/Card'
import Badge from '../ui/Badge'

function HospitalEmergencyCases({ requests = [] }) {
  const emergencies = requests.filter(
    (r) => r.urgency === 'EMERGENCY' || r.urgency === 'URGENT'
  )

  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-text-dark mb-4">Emergency Cases</h3>
      {emergencies.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">No emergency cases</p>
      ) : (
        <div className="space-y-3">
          {emergencies.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blood-soft flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blood">{req.bloodGroup}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-dark">{req.shortId}</p>
                  <p className="text-xs text-text-muted">
                    {req.unitsRequired} {req.unitsRequired === 1 ? 'unit' : 'units'}
                  </p>
                </div>
              </div>
              <Badge variant={req.urgency === 'EMERGENCY' ? 'error' : 'warning'}>
                {req.urgencyLabel}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default HospitalEmergencyCases
