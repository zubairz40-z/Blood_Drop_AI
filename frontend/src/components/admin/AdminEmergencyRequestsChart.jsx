import Card from '../ui/Card'
import Badge from '../ui/Badge'

const levelVariant = {
  NORMAL: 'info',
  URGENT: 'warning',
  CRITICAL: 'error',
}

function AdminEmergencyRequestsChart({ data = [] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <Card>
      <h3 className="text-base font-semibold text-text-dark">Emergency Requests</h3>
      <p className="text-xs text-text-muted mt-0.5">Breakdown by emergency level — demo data</p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.map((item) => (
          <div
            key={item.level}
            className="p-4 bg-surface-soft rounded-xl border border-border text-center"
          >
            <Badge variant={levelVariant[item.level] || 'neutral'} className="mb-2">
              {item.level}
            </Badge>
            <p className="text-2xl font-bold text-text-dark mt-2">{item.count}</p>
            <p className="text-xs text-text-muted mt-1">
              {total > 0 ? Math.round((item.count / total) * 100) : 0}% of total
            </p>
            <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  item.level === 'CRITICAL'
                    ? 'bg-blood'
                    : item.level === 'URGENT'
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                }`}
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default AdminEmergencyRequestsChart
