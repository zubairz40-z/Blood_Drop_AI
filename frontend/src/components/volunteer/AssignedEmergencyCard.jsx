import Card from '../ui/Card'
import Badge from '../ui/Badge'

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
}

function AssignedEmergencyCard({ assignment }) {
  if (!assignment) return null

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-dark">Assigned Emergency</h3>
          <p className="text-sm text-text-muted mt-0.5">{assignment.requestId}</p>
        </div>
        <Badge variant={emergencyVariant[assignment.emergencyLevel] || 'neutral'}>
          {assignment.emergencyLevel}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blood-soft flex items-center justify-center">
            <span className="text-sm font-bold text-blood">{assignment.bloodGroup}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-dark">{assignment.donationType}</p>
            <p className="text-xs text-text-muted">{assignment.units} {assignment.units === 1 ? 'unit' : 'units'}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Status</span>
            <Badge variant="info">{assignment.status}</Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default AssignedEmergencyCard
