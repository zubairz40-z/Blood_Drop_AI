import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fetchMyRequests } from '../../api/requestApi'
import { startMatching } from '../../api/matchApi'
import BloodDropMap from '../../components/maps/BloodDropMap'
import { normalizeCoordinates } from '../../utils/locationUtils'

function HospitalMatches() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [matchingId, setMatchingId] = useState(null)
  const [matchResult, setMatchResult] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [alert, setAlert] = useState(null)
  const [alertVariant, setAlertVariant] = useState('success')

  const load = useCallback(async () => {
    try {
      const data = await fetchMyRequests()
      setRequests(data || [])
    } catch {
      // Leave state as-is
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    load().then(() => { if (cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [load])

  async function handleStartMatching(req) {
    setMatchingId(req._id)
    setSelectedRequest(req)
    setMatchResult(null)
    setAlert(null)
    try {
      const result = await startMatching(req._id)
      setMatchResult(result)
      setAlertVariant('success')
      setAlert('Matching completed. Donors have been notified.')
      setTimeout(() => setAlert(null), 5000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Matching failed. Ensure the request has a valid location and is verified.'
      setAlertVariant('error')
      setAlert(msg)
      setTimeout(() => setAlert(null), 5000)
    } finally {
      setMatchingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Matched Donors" description="Loading..." />
        <div className="flex justify-center py-24">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  const verifiedRequests = requests.filter((r) => r.status === 'VERIFIED')
  const candidates = matchResult?.selection?.candidates || []
  const contact = matchResult?.contact || null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <PageHeader
            title="Matched Donors"
            description="Start matching for verified requests to find compatible donors."
          />
          <Badge variant="role-hospital">Hospital</Badge>
        </div>
      </div>

      {alert && (
        <Alert variant={alertVariant} onDismiss={() => setAlert(null)}>
          {alert}
        </Alert>
      )}

      {verifiedRequests.length === 0 ? (
        <EmptyState
          title="No verified requests available"
          description="Only verified blood requests can be matched with donors."
        />
      ) : (
        <Card title="Verified Requests">
          <div className="space-y-3">
            {verifiedRequests.map((req) => {
              const isMatching = matchingId === req._id
              return (
                <div
                  key={req._id}
                  className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blood-soft flex items-center justify-center">
                      <span className="text-xs font-bold text-blood">{req.bloodGroup}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-dark">
                          {String(req._id).slice(-8)}
                        </p>
                        <Badge variant="success">VERIFIED</Badge>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {req.component} · {req.unitsRequired} unit{req.unitsRequired === 1 ? '' : 's'} · {req.urgency}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleStartMatching(req)}
                    disabled={isMatching || !!matchingId}
                    loading={isMatching}
                  >
                    {isMatching ? 'Matching...' : 'Start Matching'}
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {matchResult && (
        <Card title="Matching Results">
          {/* Location visualization */}
          {selectedRequest && (() => {
            const coords = normalizeCoordinates(selectedRequest.location)
            const markers = coords
              ? [{ ...coords, type: 'request', label: selectedRequest.hospital?.name || 'Hospital', sublabel: `${selectedRequest.bloodGroup} ${selectedRequest.component}` }]
              : []
            return markers.length > 0 ? (
              <div className="mb-4">
                <BloodDropMap markers={markers} height="250px" />
              </div>
            ) : null
          })()}

          {contact && (
            <div className="mb-4 p-3 rounded-xl bg-brand-soft/20 border border-brand-soft/50">
              <p className="text-sm font-semibold text-text-dark">
                {contact.exhausted
                  ? 'No donors could be contacted.'
                  : `Donor notified (Wave ${contact.wave})`}
              </p>
              {contact.expiresAt && (
                <p className="text-xs text-text-muted mt-0.5">
                  Response deadline: {new Date(contact.expiresAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          {candidates.length === 0 ? (
            <p className="text-sm text-text-muted">No candidates found within the search radius.</p>
          ) : (
            <div className="space-y-3">
              {candidates.map((c, idx) => (
                <div
                  key={c.donorId}
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center">
                      <span className="text-xs font-bold text-brand">
                        {idx === 0 ? 'P' : `B${idx}`}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-dark">
                          {String(c.donorId).slice(-8)}
                        </p>
                        <Badge variant={idx === 0 ? 'success' : 'info'}>
                          {idx === 0 ? 'Primary' : `Backup #${idx}`}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {c.bloodGroup} · Score: {c.score}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {c.distanceKm != null && (
                      <p className="text-xs text-text-secondary">{c.distanceKm} km</p>
                    )}
                    {c.etaMinutes != null && (
                      <p className="text-xs text-text-muted">~{c.etaMinutes} min ETA</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {matchResult.selection?.radiusKm && (
            <p className="text-xs text-text-muted mt-3">
              Search radius: {matchResult.selection.radiusKm} km
            </p>
          )}
        </Card>
      )}
    </motion.div>
  )
}

export default HospitalMatches
