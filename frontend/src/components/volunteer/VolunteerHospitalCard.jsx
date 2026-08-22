import { MapPin, Navigation } from 'lucide-react'
import Card from '../ui/Card'

function VolunteerHospitalCard({ hospital }) {
  if (!hospital) return null

  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-text-dark mb-4">Destination Hospital</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-dark">{hospital.name}</p>
            <p className="text-xs text-text-muted">{hospital.location}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Location</span>
            <span className="text-text-dark font-medium">{hospital.location}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Distance</span>
            <span className="text-text-dark font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {hospital.distance} km
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default VolunteerHospitalCard
