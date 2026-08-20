function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendUp,
  className = '',
}) {
  return (
    <div
      className={`bg-white border border-border rounded-2xl shadow-card p-5 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-muted truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-text-dark mt-1">{value}</p>
          {description && (
            <p className="text-xs text-text-muted mt-1">{description}</p>
          )}
          {trend && (
            <p
              className={`text-xs font-medium mt-2 ${
                trendUp ? 'text-emerald-600' : 'text-blood'
              }`}
            >
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-brand-soft rounded-xl flex-shrink-0">
            <Icon className="w-5 h-5 text-brand" />
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
