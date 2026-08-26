import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SearchX, Pencil, XCircle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import RequestTrackingSummary from '../../components/patient/RequestTrackingSummary'
import EmergencyLevelSelector from '../../components/patient/EmergencyLevelSelector'
import {
  fetchRequestById,
  updateBloodRequest,
  cancelBloodRequest,
} from '../../api/requestApi'
import {
  bloodRequestFromApi,
  toUrgencyCode,
  toUiUrgency,
  REQUEST_STATUS_LABELS,
} from '../../api/mappers'

const TERMINAL_STATUSES = ['FULFILLED', 'CANCELLED', 'REJECTED', 'EXPIRED']

function RequestTracking() {
  const { requestId } = useParams()
  const navigate = useNavigate()

  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editForm, setEditForm] = useState({ units: '', neededBy: '', urgency: '', note: '' })
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await fetchRequestById(requestId)
        if (!cancelled) setRequest(bloodRequestFromApi(data))
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.status === 404
              ? null // handled by the empty state below
              : err.response?.data?.message || 'Could not load this request.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [requestId])

  function openEdit() {
    setEditForm({
      units: String(request.unitsRequired),
      neededBy: request.neededBy
        ? new Date(request.neededBy.getTime() - request.neededBy.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : '',
      urgency: toUiUrgency(request.urgency),
      note: request.patientNote || '',
    })
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateBloodRequest(requestId, {
        unitsRequired: Number(editForm.units),
        neededBy: editForm.neededBy,
        urgency: toUrgencyCode(editForm.urgency),
        patientNote: editForm.note,
      })
      setRequest(bloodRequestFromApi(updated))
      setEditOpen(false)
      setNotice('Your request has been updated.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this request.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel() {
    setSaving(true)
    setError(null)
    try {
      const updated = await cancelBloodRequest(requestId, cancelReason)
      setRequest(bloodRequestFromApi(updated))
      setCancelOpen(false)
      setNotice('Your request has been cancelled.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel this request.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    )
  }

  if (!request) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <EmptyState
          icon={SearchX}
          title="Request not found"
          description="This request doesn't exist, or you don't have access to it."
          action={<Button onClick={() => navigate('/patient/requests')}>Back to My Requests</Button>}
        />
      </motion.div>
    )
  }

  const isEditable = !TERMINAL_STATUSES.includes(request.status)

  // RequestTrackingSummary expects the demo field names
  const summary = {
    bloodGroup: request.bloodGroup,
    donationType: request.componentLabel,
    units: request.unitsRequired,
    hospital: request.hospital?.name || '—',
    emergencyLevel: toUiUrgency(request.urgency),
    currentStage: request.statusLabel,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-5xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Request Tracking"
          description="Follow the progress of your blood request."
          onBack={() => navigate('/patient/requests')}
        />
        <Badge variant={request.statusVariant} className="self-start">
          {request.statusLabel}
        </Badge>
      </div>

      {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}
      {notice && <Alert variant="success" onDismiss={() => setNotice(null)}>{notice}</Alert>}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-text-muted">Request ID</span>
        <span className="text-sm font-semibold text-text-dark">{request.shortId}</span>
        <Badge variant="info" className="ml-2">{request.bloodGroup}</Badge>
        <Badge variant="neutral">{request.componentLabel}</Badge>
        <Badge variant="neutral">
          {request.unitsRequired} {request.unitsRequired === 1 ? 'unit' : 'units'}
        </Badge>
      </div>

      {isEditable && (
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" icon={Pencil} onClick={openEdit}>
            Edit Request
          </Button>
          <Button variant="danger" size="sm" icon={XCircle} onClick={() => setCancelOpen(true)}>
            Cancel Request
          </Button>
        </div>
      )}

      {request.rejectionReason && (
        <Alert variant="error">Hospital rejected this request: {request.rejectionReason}</Alert>
      )}
      {request.cancellationReason && request.status === 'CANCELLED' && (
        <Alert variant="neutral">Cancelled: {request.cancellationReason}</Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Request History">
            {request.statusHistory.length === 0 ? (
              <p className="text-sm text-text-muted py-4">No history recorded yet.</p>
            ) : (
              <ol className="relative border-l border-border ml-2">
                {request.statusHistory.map((entry, index) => (
                  <li key={index} className="ml-6 pb-6 last:pb-0">
                    <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-brand" />
                    <p className="text-sm font-medium text-text-dark">
                      {REQUEST_STATUS_LABELS[entry.to] || entry.to}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(entry.changedAt).toLocaleString()}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-text-secondary mt-1">{entry.note}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <RequestTrackingSummary tracking={summary} />
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Request">
        <div className="space-y-4">
          <Input
            label="Units Required"
            name="units"
            type="number"
            value={editForm.units}
            onChange={(e) => setEditForm((p) => ({ ...p, units: e.target.value }))}
          />
          <Input
            label="Needed By"
            name="neededBy"
            type="datetime-local"
            value={editForm.neededBy}
            onChange={(e) => setEditForm((p) => ({ ...p, neededBy: e.target.value }))}
          />
          <EmergencyLevelSelector
            value={editForm.urgency}
            onChange={(v) => setEditForm((p) => ({ ...p, urgency: v }))}
          />
          <Input
            label="Note"
            name="note"
            value={editForm.note}
            onChange={(e) => setEditForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="Anything the hospital should know"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Request">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This request will be marked as cancelled. It stays in your history and can&apos;t be reactivated.
          </p>
          <Input
            label="Reason (optional)"
            name="cancelReason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Found a donor privately"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setCancelOpen(false)} disabled={saving}>
              Keep Request
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={saving}>
              Cancel Request
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

export default RequestTracking