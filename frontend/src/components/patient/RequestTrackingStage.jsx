import { CheckCircle, Circle, Dot } from 'lucide-react'

const stateConfig = {
  completed: {
    icon: CheckCircle,
    iconClass: 'text-emerald-500',
    dotClass: 'bg-emerald-500',
    labelClass: 'text-text-dark',
    descClass: 'text-text-muted',
    timestampClass: 'text-text-muted',
    lineClass: 'bg-emerald-300',
  },
  current: {
    icon: Dot,
    iconClass: 'text-brand',
    dotClass: 'bg-brand ring-4 ring-brand/20',
    labelClass: 'text-brand font-semibold',
    descClass: 'text-text-secondary',
    timestampClass: 'text-brand font-medium',
    lineClass: 'bg-border',
  },
  upcoming: {
    icon: Circle,
    iconClass: 'text-text-light',
    dotClass: 'bg-neutral-200 border-2 border-neutral-300',
    labelClass: 'text-text-muted',
    descClass: 'text-text-light',
    timestampClass: 'text-text-light',
    lineClass: 'bg-border',
  },
}

function RequestTrackingStage({ stage, isLast }) {
  const config = stateConfig[stage.status] || stateConfig.upcoming
  const Icon = config.icon

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        {stage.status === 'completed' ? (
          <Icon className={`w-5 h-5 ${config.iconClass} shrink-0`} />
        ) : stage.status === 'current' ? (
          <div className={`w-3.5 h-3.5 rounded-full ${config.dotClass} shrink-0`} />
        ) : (
          <div className={`w-3.5 h-3.5 rounded-full ${config.dotClass} shrink-0`} />
        )}
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[2rem] mt-1 rounded-full ${config.lineClass}`} />
        )}
      </div>

      <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
        <p className={`text-sm ${config.labelClass}`}>{stage.label}</p>
        {stage.description && (
          <p className={`text-xs mt-0.5 ${config.descClass}`}>{stage.description}</p>
        )}
        {stage.timestamp && (
          <p className={`text-xs mt-1 ${config.timestampClass}`}>{stage.timestamp}</p>
        )}
        {stage.status === 'current' && (
          <p className="text-xs mt-1 text-brand font-medium">Current stage</p>
        )}
      </div>
    </div>
  )
}

export default RequestTrackingStage
