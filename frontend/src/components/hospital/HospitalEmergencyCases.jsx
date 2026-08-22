import Card from '../ui/Card'
import Badge from '../ui/Badge'

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
}

function HospitalEmergencyCases({ requests = [] }) {
  const emergencies = requests.filter(
    (r) => r.emergencyLevel === 'CRITICAL' || r.emergencyLevel === 'URGENT'
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blood-soft flex items-center justify-center">
                  <span className="text-sm font-bold text-blood">{req.bloodGroup}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-dark">{req.id}</p>
                  <p className="text-xs text-text-muted">
                    {req.units} {req.units === 1 ? 'unit' : 'units'}
                  </p>
                </div>
              </div>
              <Badge variant={emergencyVariant[req.emergencyLevel] || 'neutral'}>
                {req.emergencyLevel}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default HospitalEmergencyCases
