import Card from '../ui/Card'

function AdminDonationChart({ data = [] }) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-text-dark">Donation Activity</h3>
      <p className="text-xs text-text-muted mt-0.5">Donations by blood group — demo data</p>

      <div className="mt-5 grid grid-cols-1 gap-2.5">
        {data.map((item) => (
          <div key={item.bloodGroup} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blood-soft flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-blood">{item.bloodGroup}</span>
            </div>
            <div className="flex-1 bg-neutral-100 rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-blood rounded-full flex items-center justify-end pr-2 transition-all"
                style={{ width: `${(item.count / max) * 100}%` }}
              >
                {item.count / max > 0.3 && (
                  <span className="text-[10px] font-semibold text-white">{item.count}</span>
                )}
              </div>
            </div>
            {item.count / max <= 0.3 && (
              <span className="text-xs font-medium text-text-dark w-6 text-right">{item.count}</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

export default AdminDonationChart
