import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Inbox } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fetchMyRequests, verifyBloodRequest, rejectBloodRequest } from '../../api/requestApi'
import { bloodRequestFromApi } from '../../api/mappers'

const TERMINAL_STATUSES = ['FULFILLED', 'CANCELLED', 'REJECTED', 'EXPIRED']

function RequestRow({ request, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-soft rounded-xl border border-border">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-blood-soft flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-blood">{request.bloodGroup}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-text-dark">{request.shortId}</p>
            <Badge variant={request.statusVariant}>{request.statusLabel}</Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {request.componentLabel} · {request.unitsRequired}{' '}
            {request.unitsRequired === 1 ? 'unit' : 'units'} · {request.urgencyLabel}
          </p>
          {request.neededBy && (
            <p className="text-xs text-text-muted mt-0.5">
              Needed by {request.neededBy.toLocaleString()}
            </p>
          )}
          {request.patientNote && (
            <p className="text-xs text-text-secondary mt-1 italic">
              &ldquo;{request.patientNote}&rdquo;
            </p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  )
}

function HospitalRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const [actingOn, setActingOn] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const list = await fetchMyRequests()
      setRequests(list.map(bloodRequestFromApi))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load requests.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(request) {
    setActingOn(request.id)
    setError(null)
    setNotice(null)
    try {
      const updated = await verifyBloodRequest(request.id)
      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? bloodRequestFromApi(updated) : r))
      )
      setNotice(`${request.shortId} has been verified.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not verify that request.')
    } finally {
      setActingOn(null)
    }
  }

  async function handleReject() {
    const request = rejectTarget
    setActingOn(request.id)
    setError(null)
    setNotice(null)
    try {
      const updated = await rejectBloodRequest(request.id, rejectReason)
      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? bloodRequestFromApi(updated) : r))
      )
      setRejectTarget(null)
      setRejectReason('')
      setNotice(`${request.shortId} has been rejected.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reject that request.')
    } finally {
      setActingOn(null)
    }
  }

  const pending = requests.filter((r) => r.status === 'PENDING_VERIFICATION')
  const active = requests.filter(
    (r) => r.status !== 'PENDING_VERIFICATION' && !TERMINAL_STATUSES.includes(r.status)
  )
  const past = requests.filter((r) => TERMINAL_STATUSES.includes(r.status))

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <PageHeader
            title="Blood Requests"
            description="Verify incoming patient requests and track their progress."
          />
          <Badge variant="role-hospital">Hospital</Badge>
        </div>
      </div>

      {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}
      {notice && <Alert variant="success" onDismiss={() => setNotice(null)}>{notice}</Alert>}

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-base font-semibold text-text-dark">Awaiting your verification</h3>
          {pending.length > 0 && <Badge variant="warning">{pending.length}</Badge>}
        </div>

        {pending.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nothing to verify"
            description="New patient requests addressed to your hospital will appear here."
          />
        ) : (
          <div className="space-y-3">
            {pending.map((req) => (
              <RequestRow key={req.id} request={req}>
                <Button
                  size="sm"
                  icon={Check}
                  loading={actingOn === req.id}
                  disabled={actingOn !== null}
                  onClick={() => handleVerify(req)}
                >
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={X}
                  disabled={actingOn !== null}
                  onClick={() => setRejectTarget(req)}
                >
                  Reject
                </Button>
              </RequestRow>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-text-dark mb-4">Active requests</h3>
        {active.length === 0 ? (
          <p className="text-sm text-text-muted py-4">No verified requests in progress.</p>
        ) : (
          <div className="space-y-3">
            {active.map((req) => (
              <RequestRow key={req.id} request={req} />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-text-dark mb-4">Past requests</h3>
        {past.length === 0 ? (
          <p className="text-sm text-text-muted py-4">No completed or cancelled requests yet.</p>
        ) : (
          <div className="space-y-3">
            {past.map((req) => (
              <RequestRow key={req.id} request={req} />
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title="Reject Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            The patient will see this reason. Rejected requests can&apos;t be reopened.
          </p>
          <Input
            label="Reason"
            name="rejectReason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Patient not admitted at this hospital"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setRejectTarget(null)} disabled={actingOn !== null}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} loading={actingOn !== null}>
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

export default HospitalRequests