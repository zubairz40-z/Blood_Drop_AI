import { UserCheck, MapPin, Clock3, Gauge } from 'lucide-react'
import Badge from '../ui/Badge'

function BestMatchCard({ match }) {
  if (!match) return null

  const donorName = match.name || `Donor ${String(match.id || '').slice(-4) || 'Match'}`
  const distanceText = match.distance != null && match.distance !== '—' ? `${match.distance} km` : 'Distance unavailable'
  const etaText = match.etaMinutes != null ? `${match.etaMinutes} min` : 'ETA unavailable'
  const scoreText = match.matchScore != null ? `${match.matchScore}%` : 'Score unavailable'

  return (
    <div className="bg-white border border-border rounded-2xl shadow-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-dark">BEST DONOR MATCH</h3>
            <p className="text-xs text-text-muted">Selected by the backend coordination pipeline</p>
          </div>
        </div>
        <Badge variant="success">{match.status || 'AVAILABLE'}</Badge>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center">
          <span className="text-sm font-bold text-brand">{donorName.slice(0, 1).toUpperCase()}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-text-dark">{donorName}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-medium text-text-dark">{match.bloodGroup || '—'}</span>
            <span className="text-xs text-text-muted">{match.donationType || 'Whole Blood'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl bg-surface-soft border border-border p-2">
          <div className="flex items-center gap-1 text-[10px] text-text-muted mb-1">
            <Gauge className="w-3 h-3" />
            Match score
          </div>
          <p className="text-sm font-semibold text-text-dark">{scoreText}</p>
        </div>
        <div className="rounded-xl bg-surface-soft border border-border p-2">
          <div className="flex items-center gap-1 text-[10px] text-text-muted mb-1">
            <MapPin className="w-3 h-3" />
            Distance
          </div>
          <p className="text-sm font-semibold text-text-dark">{distanceText}</p>
        </div>
        <div className="rounded-xl bg-surface-soft border border-border p-2">
          <div className="flex items-center gap-1 text-[10px] text-text-muted mb-1">
            <Clock3 className="w-3 h-3" />
            ETA
          </div>
          <p className="text-sm font-semibold text-text-dark">{etaText}</p>
        </div>
      </div>

      {match.factors && match.factors.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-medium text-text-dark mb-2">Why this candidate</p>
          <ul className="space-y-1.5">
            {match.factors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default BestMatchCard
