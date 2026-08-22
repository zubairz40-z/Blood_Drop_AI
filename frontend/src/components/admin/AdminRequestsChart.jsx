import Card from '../ui/Card'

function AdminRequestsChart({ data = [] }) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-text-dark">Blood Requests Overview</h3>
      <p className="text-xs text-text-muted mt-0.5">Demo activity — last 7 days</p>

      <div className="mt-5 space-y-3">
        {data.map((item) => (
          <div key={item.day} className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-8 shrink-0">{item.day}</span>
            <div className="flex-1 bg-neutral-100 rounded-full h-6 overflow-hidden">
              <div
                className="h-full bg-brand rounded-full flex items-center justify-end pr-2 transition-all"
                style={{ width: `${(item.count / max) * 100}%` }}
              >
                {item.count / max > 0.25 && (
                  <span className="text-[10px] font-semibold text-white">{item.count}</span>
                )}
              </div>
            </div>
            {item.count / max <= 0.25 && (
              <span className="text-xs font-medium text-text-dark w-6 text-right">{item.count}</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

export default AdminRequestsChart
