const toneMap = {
  brand: { tile: 'bg-brand-soft', icon: 'text-brand', value: 'text-brand' },
  blood: { tile: 'bg-red-50', icon: 'text-blood', value: 'text-blood' },
  success: { tile: 'bg-emerald-50', icon: 'text-emerald-600', value: 'text-emerald-700' },
  warning: { tile: 'bg-amber-50', icon: 'text-amber-600', value: 'text-amber-700' },
  info: { tile: 'bg-blue-50', icon: 'text-blue-600', value: 'text-blue-700' },
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendUp,
  tone = 'brand',
  className = '',
}) {
  const t = toneMap[tone] || toneMap.brand

  return (
    <div
      className={`bg-white border border-border rounded-2xl shadow-card p-5 hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide truncate">
            {title}
          </p>
          <p className={`text-2xl font-bold mt-1 ${t.value}`}>{value}</p>
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
          <div className={`p-3 ${t.tile} rounded-xl flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${t.icon}`} />
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
