import { MapPin } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
}

const statusVariant = {
  PENDING: 'neutral',
  MATCHING: 'info',
  'DONOR FOUND': 'success',
  'WAITING RESPONSE': 'warning',
  CONFIRMED: 'success',
  COMPLETED: 'success',
}

function RequestTrackingSummary({ tracking }) {
  if (!tracking) return null

  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-text-dark mb-4">Request Summary</h3>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Blood Group</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blood-soft flex items-center justify-center">
              <span className="text-xs font-bold text-blood">{tracking.bloodGroup}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Donation Type</span>
          <span className="text-text-dark font-medium">{tracking.donationType}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Units</span>
          <span className="text-text-dark font-medium">{tracking.units}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Hospital</span>
          <span className="text-text-dark font-medium text-right max-w-[180px]">{tracking.hospital}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Emergency Level</span>
          <Badge variant={emergencyVariant[tracking.emergencyLevel] || 'neutral'}>
            {tracking.emergencyLevel}
          </Badge>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Current Status</span>
          <Badge variant={statusVariant[tracking.currentStage] || 'neutral'}>
            {tracking.currentStage === 'WAITING_RESPONSE' ? 'WAITING RESPONSE' : tracking.currentStage}
          </Badge>
        </div>
      </div>

      {tracking.matchedDonor && (
        <div className="mt-5 pt-4 border-t border-border">
          <h4 className="text-sm font-semibold text-text-dark mb-3">Matched Donor</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Blood Group</span>
              <span className="text-text-dark font-medium">{tracking.matchedDonor.bloodGroup}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Donation Type</span>
              <span className="text-text-dark font-medium">{tracking.matchedDonor.donationType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Distance</span>
              <span className="text-text-dark font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {tracking.matchedDonor.distance} km
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default RequestTrackingSummary
