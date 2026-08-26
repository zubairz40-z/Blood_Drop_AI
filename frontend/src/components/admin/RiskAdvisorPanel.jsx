import { ShieldAlert, MapPin, CheckCircle } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

const levelVariant = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error',
}

const levelOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

function RiskAdvisorPanel({ alerts = [] }) {
  const sorted = [...alerts].sort(
    (a, b) => (levelOrder[a.level] ?? 4) - (levelOrder[b.level] ?? 4)
  )

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5 text-brand" />
        <h3 className="text-base font-semibold text-text-dark">Risk Advisor</h3>
        <span className="text-xs text-text-muted ml-auto">
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-text-dark">No risk alerts</p>
          <p className="text-xs text-text-muted mt-1">
            All monitored requests are within normal operational parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-xl border ${
                alert.level === 'CRITICAL'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-surface-soft border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Badge variant={levelVariant[alert.level] || 'neutral'}>
                  {alert.level}
                  {alert.riskScore != null ? ` (score ${alert.riskScore})` : ''}
                </Badge>
                <div className="flex items-center gap-2">
                  {alert.urgency && (
                    <Badge variant={alert.urgency === 'EMERGENCY' ? 'error' : 'neutral'}>
                      {alert.urgency}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-text-dark">{alert.title}</p>
              <p className="text-xs text-text-muted mt-0.5">{alert.description}</p>

              {alert.recommendation && (
                <p className="text-xs text-brand mt-2 font-medium">
                  Recommendation: {alert.recommendation}
                </p>
              )}

              {alert.reasons && alert.reasons.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {alert.reasons.map((reason, idx) => (
                    <li key={idx} className="text-[11px] text-text-muted flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5 shrink-0">&#9679;</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
                {alert.bloodGroup && (
                  <span className="text-xs font-medium text-blood">{alert.bloodGroup}</span>
                )}
                {alert.component && (
                  <span className="text-xs text-text-muted">{alert.component}</span>
                )}
                {alert.hospital && (
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {alert.hospital}
                  </span>
                )}
                {alert.status && (
                  <Badge variant="neutral" className="text-[9px] ml-auto">{alert.status}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default RiskAdvisorPanel
