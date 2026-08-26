import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Droplets,
  HeartPulse,
  Building2,
  MapPin,
  Clock,
  Boxes,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fetchRequestById } from '../../api/requestApi'
import { respondToMatch } from '../../api/matchApi'
import { fetchNotifications } from '../../api/notificationApi'
import { useCountdown } from '../../hooks/useCountdown'
import { bloodRequestFromApi } from '../../api/mappers'
import BloodDropMap from '../../components/maps/BloodDropMap'
import { normalizeCoordinates } from '../../utils/locationUtils'

function CountdownBar({ expiresAt }) {
  const { formatted, expired, remainingSeconds } = useCountdown(expiresAt)
  if (!expiresAt) return null

  const pct = expired ? 0 : Math.max(0, Math.min(100, (remainingSeconds / 120) * 100))

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">Respond within</span>
        <span className={`text-sm font-mono font-bold ${expired ? 'text-text-muted' : 'text-amber-600'}`}>
          {formatted}
        </span>
      </div>
      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${expired ? 'bg-neutral-300' : 'bg-amber-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function DonorEmergencyRequestDetails() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [responded, setResponded] = useState(null)
  const [error, setError] = useState(null)
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [declineModalOpen, setDeclineModalOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      // Fetch the request details and look for a matching notification
      const [requestData, notifResult] = await Promise.all([
        fetchRequestById(requestId),
        fetchNotifications().catch(() => ({ notifications: [] })),
      ])
      if (!requestData) return

      setRequest(bloodRequestFromApi(requestData))

      // Find the active MATCH_FOUND notification for this request
      const matchNotif = notifResult.notifications.find(
        (n) => n.type === 'MATCH_FOUND' && n.requestId === requestId
      )
      setNotification(matchNotif || null)
    } catch {
      // Request not found or access denied
    } finally {
      setLoading(false)
    }
  }, [requestId])

  useEffect(() => {
    let cancelled = false
    load().then(() => { if (cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [load])

  const isExpired = notification?.expiresAt && new Date(notification.expiresAt) <= new Date()
  const isActionable = notification?.expiresAt && !isExpired && !responded

  async function handleAccept() {
    setResponding(true)
    setError(null)
    try {
      await respondToMatch(requestId, 'ACCEPT')
      setResponded('ACCEPT')
      setAcceptModalOpen(false)
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message
      if (status === 409) {
        setError('This match offer has expired. The system has moved on to the next donor.')
        setResponded('EXPIRED')
      } else if (status === 400) {
        setError(msg || 'Invalid response.')
      } else if (status === 403) {
        setError('You are not authorized to respond to this request.')
      } else {
        setError(msg || 'Unable to process your response.')
      }
    } finally {
      setResponding(false)
    }
  }

  async function handleDecline() {
    setResponding(true)
    setError(null)
    try {
      await respondToMatch(requestId, 'DECLINE')
      setResponded('DECLINE')
      setDeclineModalOpen(false)
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message
      if (status === 409) {
        setError('This match offer has expired.')
        setResponded('EXPIRED')
      } else {
        setError(msg || 'Unable to process your response.')
      }
    } finally {
      setResponding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Emergency Request" description="Loading..." onBack={() => navigate('/donor/requests')} />
        <div className="flex justify-center py-24">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Request not found"
        description="This emergency request could not be found."
        action={
          <Button onClick={() => navigate('/donor/requests')}>
            Back to Emergency Requests
          </Button>
        }
      />
    )
  }

  const urgencyVariant = {
    EMERGENCY: 'error',
    ROUTINE: 'info',
  }
  const urgency = urgencyVariant[request.urgency] || 'neutral'
  const wave = notification?.wave

  // Build map markers from request location
  const requestCoords = normalizeCoordinates(request.location)
  const mapMarkers = requestCoords
    ? [{ ...requestCoords, type: 'request', label: request.hospital?.name || 'Hospital', sublabel: request.location?.address || '' }]
    : []

  const infoItems = [
    { icon: Droplets, label: 'Blood Group', value: request.bloodGroup },
    { icon: Boxes, label: 'Component', value: request.componentLabel || request.component },
    { icon: Boxes, label: 'Units Needed', value: `${request.unitsRequired} ${request.unitsRequired === 1 ? 'unit' : 'units'}` },
    { icon: Building2, label: 'Hospital', value: request.hospital?.name || '—' },
    { icon: Clock, label: 'Urgency', value: request.urgency },
  ]

  if (notification?.distanceKm != null) {
    infoItems.push({ icon: MapPin, label: 'Distance', value: `${notification.distanceKm} km` })
  }
  if (notification?.etaMinutes != null) {
    infoItems.push({ icon: Clock, label: 'Estimated ETA', value: `~${notification.etaMinutes} min` })
  }
  if (request.patientNote) {
    infoItems.push({ icon: HeartPulse, label: 'Note', value: request.patientNote })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Emergency Request"
          description={request.shortId || requestId}
          onBack={() => navigate('/donor/requests')}
          action={<Badge variant={urgency}>{request.urgency}</Badge>}
        />
        {wave != null && (
          <Badge variant="error">Wave {wave}</Badge>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          {error}
        </div>
      )}

      {responded === 'ACCEPT' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Request Accepted</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              You accepted this request. Hospital coordination details will follow.
            </p>
          </div>
        </div>
      )}

      {responded === 'DECLINE' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Request Declined</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You declined this request. The system will notify the next available donor.
            </p>
          </div>
        </div>
      )}

      {responded === 'EXPIRED' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
          <AlertTriangle className="w-5 h-5 text-text-muted flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-text-dark">Offer Expired</p>
            <p className="text-xs text-text-muted mt-0.5">
              This match offer has expired. The system has moved on to the next donor.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-blood-soft flex items-center justify-center">
                <span className="text-3xl font-bold text-blood">{request.bloodGroup}</span>
              </div>
              <h3 className="text-lg font-semibold text-text-dark mt-4">
                {request.componentLabel || request.component}
              </h3>
              <p className="text-sm text-text-muted mt-1">
                {request.unitsRequired} {request.unitsRequired === 1 ? 'unit' : 'units'} needed
              </p>
              <div className="mt-3">
                <Badge variant={urgency}>{request.urgency}</Badge>
              </div>
              {wave != null && (
                <div className="mt-2">
                  <Badge variant="error">Wave {wave} — {wave === 1 ? 'Primary donor' : 'Backup donor'}</Badge>
                </div>
              )}
            </div>

            {isActionable && (
              <div className="mt-4 pt-4 border-t border-border">
                <CountdownBar expiresAt={notification.expiresAt} />
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card title="Request Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoItems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="p-2 bg-neutral-100 rounded-lg flex-shrink-0">
                      <Icon className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">{item.label}</p>
                      <p className="text-sm font-medium text-text-dark mt-0.5">{item.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {request.location && (
            <Card title="Location">
              <BloodDropMap markers={mapMarkers} height="250px" />
              <div className="flex items-center gap-2 mt-3">
                <MapPin className="w-4 h-4 text-text-muted flex-shrink-0" />
                <p className="text-sm text-text-dark">{request.hospital?.name || '—'}</p>
              </div>
              {request.location.address && (
                <p className="text-sm text-text-secondary mt-1 ml-6">
                  {request.location.address}
                </p>
              )}
              {notification?.distanceKm != null && (
                <p className="text-xs text-text-muted mt-2 ml-6">
                  Distance: {notification.distanceKm} km · ETA: ~{notification.etaMinutes} min
                </p>
              )}
            </Card>
          )}

          {isActionable && (
            <Card>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-end">
                <p className="text-sm text-text-muted mr-auto">Ready to respond?</p>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setDeclineModalOpen(true)}
                    disabled={responding}
                    className="flex-1 sm:flex-none"
                  >
                    Decline
                  </Button>
                  <Button
                    onClick={() => setAcceptModalOpen(true)}
                    disabled={responding}
                    loading={responding}
                    className="flex-1 sm:flex-none"
                  >
                    Accept Request
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title="Accept this emergency request?"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAcceptModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAccept} loading={responding}>
              Accept Request
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          You are confirming your availability to respond to this blood request.
          The hospital and coordination team will be notified.
        </p>
      </Modal>

      <Modal
        open={declineModalOpen}
        onClose={() => setDeclineModalOpen(false)}
        title="Decline this request?"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeclineModalOpen(false)}>
              Keep Request
            </Button>
            <Button variant="danger" onClick={handleDecline} loading={responding}>
              Decline
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          The system will move on to the next available backup donor.
        </p>
      </Modal>
    </motion.div>
  )
}

export default DonorEmergencyRequestDetails
