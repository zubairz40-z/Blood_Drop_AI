import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import Card from '../ui/Card'

function PatientProfileSummary({ name, bloodGroup, activeRequests, completedRequests, completeness = 0 }) {
  return (
    <Card className="h-fit">
      <div className="flex flex-col items-center text-center">
        <Avatar name={name} size="xl" />
        <h3 className="text-lg font-semibold text-text-dark mt-4">{name}</h3>
        <p className="text-sm text-text-muted mt-0.5">Patient profile</p>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-base font-bold text-text-dark">{bloodGroup}</span>
          <Badge variant={activeRequests > 0 ? 'warning' : 'success'}>
            {activeRequests > 0 ? 'Active Request' : 'No Active Request'}
          </Badge>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Profile completeness</span>
          <span className="font-semibold text-text-dark">{completeness}%</span>
        </div>
        <div className="mt-2 h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-border space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Active Requests</span>
          <span className="font-semibold text-text-dark">{activeRequests}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Completed Requests</span>
          <span className="font-semibold text-text-dark">{completedRequests}</span>
        </div>
      </div>
    </Card>
  )
}

export default PatientProfileSummary
