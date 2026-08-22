import Card from '../ui/Card'

const typeColors = {
  'Whole Blood': 'bg-blood',
  Plasma: 'bg-amber-500',
  Platelets: 'bg-blue-500',
  'Double Red Cells': 'bg-emerald-500',
}

function AdminDonationTypesChart({ data = [] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-text-dark">Donation Types</h3>
      <p className="text-xs text-text-muted mt-0.5">Breakdown by donation type — demo data</p>

      <div className="mt-5 space-y-4">
        {data.map((item) => (
          <div key={item.type}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-text-dark">{item.type}</span>
              <span className="text-xs text-text-muted">{item.count} ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)</span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${typeColors[item.type] || 'bg-brand'}`}
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default AdminDonationTypesChart
