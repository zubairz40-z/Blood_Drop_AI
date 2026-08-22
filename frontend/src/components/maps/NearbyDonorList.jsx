import { User, Star } from 'lucide-react'
import Badge from '../ui/Badge'

const statusVariant = {
  BEST_MATCH: 'success',
  COMPATIBLE: 'info',
}

function NearbyDonorList({ donors = [], selectedId, onSelect }) {
  return (
    <div className="space-y-2">
      {donors.map((donor) => {
        const isSelected = selectedId === donor.id
        const isBestMatch = donor.status === 'BEST_MATCH'

        return (
          <button
            key={donor.id}
            onClick={() => onSelect(donor.id)}
            className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? 'border-brand bg-brand-soft/30 shadow-sm'
                : 'border-border bg-surface-soft hover:bg-neutral-50'
            }`}
            aria-label={`${isBestMatch ? 'Best match donor' : 'Donor'} ${donor.id}, ${donor.bloodGroup}, approximately ${donor.distance} kilometers away`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isBestMatch ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                  {isBestMatch ? (
                    <Star className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-text-dark">{donor.id}</span>
                    {isBestMatch && (
                      <Badge variant="success" className="text-[9px] px-1.5 py-0">BEST MATCH</Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    {donor.bloodGroup} · {donor.donationType}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-text-dark">~{donor.distance} km</p>
                <Badge variant={statusVariant[donor.status] || 'neutral'} className="text-[9px]">
                  {donor.availability}
                </Badge>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default NearbyDonorList
