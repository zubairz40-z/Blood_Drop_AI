import { ShieldAlert } from 'lucide-react'
import Badge from '../ui/Badge'

function RiskAdvisorStatus({ risk }) {
  if (!risk) return null

  return (
    <div className="bg-white border border-border rounded-2xl shadow-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-blue-50 rounded-xl">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-dark">Risk & Advisor</h3>
          <p className="text-xs text-text-muted">Parallel advisory system</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border">
          <span className="text-sm text-text-dark">Status</span>
          <Badge variant="info">{risk.status}</Badge>
        </div>

        <div className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border">
          <span className="text-sm text-text-dark">Request urgency</span>
          <Badge variant="warning">{risk.urgency}</Badge>
        </div>

        <div className="p-3 bg-surface-soft rounded-xl border border-border">
          <span className="text-sm text-text-dark">Advisory</span>
          <p className="text-xs text-text-muted mt-1">{risk.advisory}</p>
        </div>
      </div>
    </div>
  )
}

export default RiskAdvisorStatus
