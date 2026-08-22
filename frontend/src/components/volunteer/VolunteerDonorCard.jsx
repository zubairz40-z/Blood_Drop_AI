import { UserCheck } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

function VolunteerDonorCard({ donor }) {
  if (!donor) return null

  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-text-dark mb-4">Donor</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-dark">{donor.id}</p>
            <Badge variant="success" className="mt-1">{donor.availability}</Badge>
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
            <span className="text-text-muted">Contact</span>
            <span className="text-xs text-text-muted">Available for coordination</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default VolunteerDonorCard
