import { useState } from 'react'
import { Phone, Car, Route, CheckCircle } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Alert from '../ui/Alert'

function VolunteerActions({ status, onStatusChange }) {
  const [callOpen, setCallOpen] = useState(false)
  const [transportConfirm, setTransportConfirm] = useState(false)
  const [guideConfirm, setGuideConfirm] = useState(false)
  const [completeConfirm, setCompleteConfirm] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  const isCompleted = status === 'COMPLETED'

  function showSuccess(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  function handleTransportConfirm() {
    onStatusChange('TRANSPORT ASSISTANCE')
    setTransportConfirm(false)
    showSuccess('Transportation assistance started for this demo session.')
  }

  function handleGuideConfirm() {
    onStatusChange('GUIDING DONOR')
    setGuideConfirm(false)
    showSuccess('Donor guidance started for this demo session.')
  }

  function handleCompleteConfirm() {
    onStatusChange('COMPLETED')
    setCompleteConfirm(false)
    showSuccess('Assistance marked complete for this demo session.')
  }

  const actions = [
    {
      key: 'call',
      label: 'Call Donor',
      icon: Phone,
      disabled: false,
      onClick: () => setCallOpen(true),
    },
    {
      key: 'transport',
      label: 'Assist Transportation',
      icon: Car,
      disabled: isCompleted,
      onClick: () => setTransportConfirm(true),
    },
    {
      key: 'guide',
      label: 'Guide Donor',
      icon: Route,
      disabled: isCompleted,
      onClick: () => setGuideConfirm(true),
    },
    {
      key: 'confirm',
      label: 'Confirm Assistance',
      icon: CheckCircle,
      disabled: isCompleted,
      onClick: () => setCompleteConfirm(true),
    },
  ]

  return (
    <>
      {successMsg && (
        <Alert variant="success" onDismiss={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      <Card title="Volunteer Actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.key}
                onClick={action.onClick}
                disabled={action.disabled}
                className="flex flex-col items-center gap-2 p-4 bg-surface-soft rounded-xl border border-border hover:border-brand-soft hover:bg-brand-soft/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-surface-soft"
              >
                <Icon className="w-6 h-6 text-brand" />
                <span className="text-sm font-medium text-text-dark text-center">{action.label}</span>
              </button>
            )
          })}
        </div>
      </Card>

      <Modal
        open={callOpen}
        onClose={() => setCallOpen(false)}
        title="Call Donor"
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          Direct donor calling will be connected when verified contact information is available through the backend.
        </p>
        <p className="text-xs text-text-muted mt-2">Frontend demo action only.</p>
      </Modal>

      <Modal
        open={transportConfirm}
        onClose={() => setTransportConfirm(false)}
        title="Start Transportation Assistance?"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setTransportConfirm(false)}>Cancel</Button>
            <Button onClick={handleTransportConfirm}>Confirm</Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          This will update the volunteer task status for this demo session.
        </p>
      </Modal>

      <Modal
        open={guideConfirm}
        onClose={() => setGuideConfirm(false)}
        title="Start Donor Guidance?"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setGuideConfirm(false)}>Cancel</Button>
            <Button onClick={handleGuideConfirm}>Confirm</Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          This will update the volunteer task status for this demo session.
        </p>
      </Modal>

      <Modal
        open={completeConfirm}
        onClose={() => setCompleteConfirm(false)}
        title="Confirm Assistance Completed?"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setCompleteConfirm(false)}>Cancel</Button>
            <Button onClick={handleCompleteConfirm}>Confirm Assistance</Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          This will mark the assistance as complete for this demo session.
        </p>
      </Modal>
    </>
  )
}

export default VolunteerActions
