import { useState } from 'react'
import { Eye, CheckCircle } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

const statusVariant = {
  'WAITING CONFIRMATION': 'warning',
  CONFIRMED: 'success',
  COMPLETED: 'success',
}

function HospitalMatchedDonors({ donors = [], onConfirmDonor }) {
  const [viewingDonor, setViewingDonor] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)

  function handleConfirm() {
    if (confirmTarget && onConfirmDonor) {
      onConfirmDonor(confirmTarget.id)
    }
    setConfirmTarget(null)
  }

  return (
    <>
      <Card className="h-full">
        <h3 className="text-base font-semibold text-text-dark mb-4">Matched Donors</h3>
        <div className="space-y-3">
          {donors.map((donor) => (
            <div
              key={donor.id}
              className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center">
                  <span className="text-xs font-bold text-brand">{donor.id}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-dark">{donor.bloodGroup}</p>
                    <span className="text-xs text-text-muted">{donor.donationType}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {donor.requestId} · {donor.distance} km away
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant[donor.status] || 'neutral'}>
                  {donor.status}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Eye}
                  onClick={() => setViewingDonor(donor)}
                  aria-label={`View donor ${donor.id}`}
                />
                {donor.status === 'WAITING CONFIRMATION' && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={CheckCircle}
                    onClick={() => setConfirmTarget(donor)}
                    aria-label={`Confirm donor ${donor.id}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={!!viewingDonor}
        onClose={() => setViewingDonor(null)}
        title="Donor Details"
        size="sm"
      >
        {viewingDonor && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Donor ID</span>
              <span className="text-text-dark font-medium">{viewingDonor.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Blood Group</span>
              <span className="text-text-dark font-medium">{viewingDonor.bloodGroup}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Donation Type</span>
              <span className="text-text-dark font-medium">{viewingDonor.donationType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Distance</span>
              <span className="text-text-dark font-medium">{viewingDonor.distance} km</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Matched Request</span>
              <span className="text-text-dark font-medium">{viewingDonor.requestId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Status</span>
              <Badge variant={statusVariant[viewingDonor.status] || 'neutral'}>
                {viewingDonor.status}
              </Badge>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title="Confirm Donor Match"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm Donor
            </Button>
          </div>
        }
      >
        {confirmTarget && (
          <p className="text-sm text-text-secondary">
            Confirm this donor match for <span className="font-semibold text-text-dark">{confirmTarget.id}</span> ({confirmTarget.bloodGroup})? This will mark the donor as confirmed for this demo session.
          </p>
        )}
      </Modal>
    </>
  )
}

export default HospitalMatchedDonors
