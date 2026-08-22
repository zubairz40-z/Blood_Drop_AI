import { Droplets, Building2, User, Star } from 'lucide-react'

const legendItems = [
  { icon: Droplets, color: 'bg-blood', label: 'Request' },
  { icon: Building2, color: 'bg-brand', label: 'Hospital' },
  { icon: User, color: 'bg-blue-500', label: 'Nearby Donor' },
  { icon: Star, color: 'bg-emerald-500', label: 'Best Match' },
]

function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {legendItems.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full ${item.color} flex items-center justify-center`}>
              <Icon className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-xs text-text-muted">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default MapLegend
