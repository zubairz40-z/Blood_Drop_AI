import { ShieldAlert } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

const levelVariant = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'error',
}

function RiskAdvisorPanel({ alerts = [] }) {
  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5 text-brand" />
        <h3 className="text-base font-semibold text-text-dark">Risk Advisor</h3>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-3 bg-surface-soft rounded-xl border border-border"
          >
            <div className="flex items-center justify-between mb-1.5">
              <Badge variant={levelVariant[alert.level] || 'neutral'}>
                {alert.level}
              </Badge>
              <span className="text-xs text-text-muted">{alert.area}</span>
            </div>
            <p className="text-sm font-medium text-text-dark">{alert.title}</p>
            <p className="text-xs text-text-muted mt-0.5">{alert.description}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default RiskAdvisorPanel
