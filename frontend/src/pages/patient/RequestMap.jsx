import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SearchX, Building2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import BloodDropMap from '../../components/maps/BloodDropMap'
import { fetchRequestById } from '../../api/requestApi'
import { bloodRequestFromApi } from '../../api/mappers'
import { normalizeCoordinates } from '../../utils/locationUtils'

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
  ROUTINE: 'info',
}

function RequestMap() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await fetchRequestById(requestId)
        if (!cancelled) setRequest(bloodRequestFromApi(data))
      } catch {
        if (!cancelled) setError('Unable to load request location data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [requestId])

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <PageHeader title="Request Map" description="Loading..." onBack={() => navigate('/patient/requests')} />
        <div className="flex justify-center py-24"><LoadingSpinner /></div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl mx-auto">
        <EmptyState
          icon={SearchX}
          title="Request not found"
          description={error || 'No location information is available for this request.'}
          action={<Button onClick={() => navigate('/patient/requests')}>Back to My Requests</Button>}
        />
      </motion.div>
    )
  }

  const requestCoords = normalizeCoordinates(request.location)
  const mapMarkers = requestCoords
    ? [{ ...requestCoords, type: 'request', label: request.shortId || requestId, sublabel: request.hospital?.name || '' }]
    : []

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Request Map"
          description="View the approximate location for this blood request."
          onBack={() => navigate(`/patient/requests/${requestId}/tracking`)}
        />
        <div className="flex items-center gap-2 self-start">
          <span className="text-sm text-text-muted">Request ID</span>
          <span className="text-sm font-semibold text-text-dark">{request.shortId}</span>
          <Badge variant={emergencyVariant[request.urgency] || 'neutral'}>{request.urgency}</Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="info">{request.bloodGroup}</Badge>
        <Badge variant="neutral">{request.componentLabel || request.component}</Badge>
        <Badge variant="neutral">{request.unitsRequired} {request.unitsRequired === 1 ? 'unit' : 'units'}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BloodDropMap markers={mapMarkers} height="400px" />
          {!requestCoords && (
            <Alert variant="warning" className="text-xs mt-2">
              Location coordinates are not available for this request. The hospital address is shown below.
            </Alert>
          )}
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card title="Request Details">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blood-soft flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blood">{request.bloodGroup}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-dark">{request.componentLabel || request.component}</p>
                  <p className="text-xs text-text-muted">{request.unitsRequired} unit{request.unitsRequired === 1 ? '' : 's'} needed</p>
                </div>
              </div>
              {request.hospital && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Hospital Destination</p>
                    <p className="text-sm font-semibold text-text-dark">{request.hospital.name}</p>
                    {request.location?.address && (
                      <p className="text-xs text-text-muted mt-0.5">{request.location.address}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate(`/patient/requests/${requestId}/tracking`)}>
              View Tracking
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/patient/requests/${requestId}/coordination`)}>
              View AI Coordination
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default RequestMap
