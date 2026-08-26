import { CheckCircle } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'

function CompletedRequests({ requests = [] }) {
  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-text-dark mb-4">Completed Requests</h3>
      {requests.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="No completed requests"
          description="Completed requests will appear here."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-700">{req.bloodGroup}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-dark">{req.componentLabel}</p>
                  <p className="text-xs text-text-muted">
                    {req.unitsRequired} {req.unitsRequired === 1 ? 'unit' : 'units'} · {req.shortId}
                  </p>
                </div>
              </div>
              <Badge variant="success">COMPLETED</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default CompletedRequests
