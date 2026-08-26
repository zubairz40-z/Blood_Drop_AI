import Badge from '../ui/Badge'

const statusVariant = {
  COMPLETED: 'success',
  ERROR: 'error',
  PENDING: 'neutral',
  CURRENT: 'primary',
  MONITORING: 'info',
  UPCOMING: 'neutral',
}

function AIAgentCard({ icon: Icon, title, status, description, outputs, children, className = '' }) {
  return (
    <div className={`bg-white border border-border rounded-2xl shadow-card p-5 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2.5 bg-brand-soft rounded-xl">
              <Icon className="w-5 h-5 text-brand" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-text-dark">{title}</h3>
            {description && (
              <p className="text-xs text-text-muted mt-0.5 max-w-sm">{description}</p>
            )}
          </div>
        </div>
        {status && (
          <Badge variant={statusVariant[status] || 'neutral'}>{status}</Badge>
        )}
      </div>

      {outputs && outputs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <ul className="space-y-1.5">
            {outputs.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {children}
    </div>
  )
}

export default AIAgentCard
