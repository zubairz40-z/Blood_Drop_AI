import { Bot } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

const statusVariant = {
  READY: 'success',
  MONITORING: 'info',
  ERROR: 'error',
  OFFLINE: 'neutral',
}

function AISystemStatus({ agents = [] }) {
  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-1">
        <Bot className="w-5 h-5 text-brand" />
        <h3 className="text-base font-semibold text-text-dark">AI System Status</h3>
      </div>
      <p className="text-xs text-text-muted mb-4">
        Demo system status. Live agent health will be connected during backend/AI integration.
      </p>

      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border"
          >
            <span className="text-sm font-medium text-text-dark">{agent.name}</span>
            <Badge variant={statusVariant[agent.status] || 'neutral'}>
              {agent.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default AISystemStatus
