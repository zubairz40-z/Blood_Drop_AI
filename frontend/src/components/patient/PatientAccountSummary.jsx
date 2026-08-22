import Card from '../ui/Card'

function PatientAccountSummary({ activeRequests, completedRequests }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-amber-600">{activeRequests}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-dark">Active Requests</p>
          <p className="text-xs text-text-muted mt-0.5">Currently in progress</p>
        </div>
      </Card>

      <Card className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-emerald-600">{completedRequests}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-dark">Completed Requests</p>
          <p className="text-xs text-text-muted mt-0.5">Successfully fulfilled</p>
        </div>
      </Card>
    </div>
  )
}

export default PatientAccountSummary
