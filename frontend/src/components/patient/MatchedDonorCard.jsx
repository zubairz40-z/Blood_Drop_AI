import { UserCheck, MapPin } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

function MatchedDonorCard({ donor }) {
  if (!donor) {
    return (
      <Card className="h-full">
        <h3 className="text-base font-semibold text-text-dark mb-4">Matched Donor</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
            <UserCheck className="w-6 h-6 text-text-light" />
          </div>
          <p className="text-sm text-text-muted">Searching for a compatible donor</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-text-dark mb-4">Matched Donor</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-dark">Donor found</p>
            <Badge variant="success" className="mt-1">{donor.status}</Badge>
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Blood Group</span>
            <span className="text-text-dark font-medium">{donor.bloodGroup}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Donation Type</span>
            <span className="text-text-dark font-medium">{donor.donationType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Distance</span>
            <span className="text-text-dark font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {donor.distance} km
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default MatchedDonorCard
