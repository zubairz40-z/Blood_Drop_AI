import { UserCheck, MapPin } from 'lucide-react'
import Badge from '../ui/Badge'

function BestMatchCard({ match }) {
  if (!match) return null

  return (
    <div className="bg-white border border-border rounded-2xl shadow-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-dark">Best Match</h3>
            <p className="text-xs text-text-muted">Top candidate from demo coordination</p>
          </div>
        </div>
        <Badge variant="success">IDENTIFIED</Badge>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center">
          <span className="text-sm font-bold text-brand">{match.id}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-text-dark">{match.bloodGroup}</span>
            <span className="text-sm text-text-muted">{match.donationType}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-text-muted flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {match.distance} km
            </span>
            <Badge variant="success" className="text-[10px]">{match.availability}</Badge>
          </div>
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
