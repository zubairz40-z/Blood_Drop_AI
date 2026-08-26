import { MapPin } from 'lucide-react'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import MapMarker from '../maps/MapMarker'
import MapLegend from '../maps/MapLegend'

function VolunteerMapModal({ open, onClose, task }) {
  if (!task) return null

  const hospitalName = task.hospital?.name || 'Hospital'
  const hospitalAddress = task.hospital?.address || ''
  const urgency = task.urgency || 'ROUTINE'

  return (
    <Modal open={open} onClose={onClose} title="Coordination Map" size="lg">
      <p className="text-xs text-text-muted mb-4">
        Approximate coordination area for your current assignment.
      </p>

      <div className="relative w-full aspect-[4/3] bg-neutral-50 rounded-xl border border-border overflow-hidden mb-4">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="vol-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e5e5" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#vol-grid)" />
          <line x1="10" y1="40" x2="90" y2="40" stroke="#d4d4d4" strokeWidth="0.5" />
          <line x1="10" y1="60" x2="90" y2="60" stroke="#d4d4d4" strokeWidth="0.5" />
          <line x1="35" y1="10" x2="35" y2="90" stroke="#d4d4d4" strokeWidth="0.5" />
          <line x1="65" y1="10" x2="65" y2="90" stroke="#d4d4d4" strokeWidth="0.5" />
          <line x1="30%" y1="45%" x2="70%" y2="55%" stroke="#F72585" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
        </svg>

        <MapMarker
          x={30}
          y={45}
          type="donor"
          label="Donor Area"
          sublabel={task.address || 'Approximate'}
        />
        <MapMarker
          x={70}
          y={55}
          type="hospital"
          label={hospitalName}
          sublabel={hospitalAddress}
        />
      </div>

      <MapLegend />

      <div className="mt-4 p-3 bg-surface-soft rounded-xl border border-border">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-brand" />
          <span className="text-sm font-medium text-text-dark">Assignment Summary</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-text-muted">Donor Area</span>
            <p className="font-medium text-text-dark">{task.address || 'Approximate'}</p>
          </div>
          <div>
            <span className="text-text-muted">Hospital</span>
            <p className="font-medium text-text-dark">{hospitalName}</p>
          </div>
          <div>
            <span className="text-text-muted">Blood Group</span>
            <p className="font-medium text-text-dark">{task.request?.bloodGroup || '-'}</p>
          </div>
          <div>
            <span className="text-text-muted">Emergency</span>
            <Badge variant={urgency === 'EMERGENCY' ? 'error' : urgency === 'URGENT' ? 'warning' : 'info'}>{urgency}</Badge>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-text-muted mt-3">
        For privacy, donor locations are shown only as approximate coordination areas.
      </p>
    </Modal>
  )
}

export default VolunteerMapModal
