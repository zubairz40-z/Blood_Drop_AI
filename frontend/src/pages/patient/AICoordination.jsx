import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BrainCircuit, Users, ShieldCheck, MapPin, ArrowDown, SearchX, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import AIAgentCard from '../../components/ai/AIAgentCard'
import BestMatchCard from '../../components/ai/BestMatchCard'
import RiskAdvisorStatus from '../../components/ai/RiskAdvisorStatus'
import NotificationStatusCard from '../../components/ai/NotificationStatusCard'
import { coordinateBloodRequest } from '../../api/aiApi'
import { fetchRequestById } from '../../api/requestApi'
import { bloodRequestFromApi } from '../../api/mappers'
import BloodDropMap from '../../components/maps/BloodDropMap'
import { normalizeCoordinates } from '../../utils/locationUtils'

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
  ROUTINE: 'info',
}

const actionLabel = {
  CONTACT_PRIMARY_DONOR: 'CONTACTING DONOR',
  EXPAND_SEARCH: 'EXPANDING SEARCH',
  NO_ELIGIBLE_CANDIDATES: 'NO ELIGIBLE DONORS',
  MANUAL_REVIEW_REQUIRED: 'MANUAL REVIEW',
}

function Connector() {
  return (
    <div className="flex justify-center py-1">
      <ArrowDown className="w-4 h-4 text-text-light" />
    </div>
  )
}

function AICoordination() {
  const { requestId } = useParams()
  const navigate = useNavigate()

  const [result, setResult] = useState(null)
  const [requestInfo, setRequestInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const reqData = await fetchRequestById(requestId)
        const request = bloodRequestFromApi(reqData)
        const canCoordinate = ['VERIFIED', 'MATCHING'].includes(request?.status)
        let aiResult = null

        if (canCoordinate) {
          aiResult = await coordinateBloodRequest(requestId)
        } else {
          aiResult = {
            requestInfo: {
              bloodGroup: request.bloodGroup,
              component: request.component,
              urgency: request.urgency,
              unitsRequired: request.unitsRequired,
              status: request.status,
              requestLocation: reqData.location || null,
              hospitalName: request.hospital?.name || null,
            },
            recommendedDonor: request.matchedDonor?.id || null,
            bestDonor: request.matchedDonor
              ? { donorId: request.matchedDonor.id, name: request.matchedDonor.name }
              : null,
            nextAction: request.status === 'FULFILLED' ? 'FULFILLED' : 'ACCEPTED',
            agentStatus: {},
          }
        }

        if (!cancelled) {
          setResult(aiResult)
          setRequestInfo(request)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              'AI coordination is temporarily unavailable.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [requestId, retryCount])

  useEffect(() => {
    let cancelled = false
    const refreshStatus = async () => {
      try {
        const request = await fetchRequestById(requestId)
        if (!cancelled) setRequestInfo(bloodRequestFromApi(request))
      } catch {
        // Keep the last known coordination result visible during refreshes.
      }
    }
    const timer = setInterval(refreshStatus, 4000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [requestId])

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <PageHeader
          title="AI Coordination"
          description="Running the coordination workflow..."
          onBack={() => navigate(`/patient/requests/${requestId}/tracking`)}
        />
        <div className="flex justify-center py-24">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <EmptyState
          icon={AlertTriangle}
          title="AI coordination unavailable"
          description={error}
          action={
            <div className="flex justify-center gap-3">
              <Button onClick={() => setRetryCount((count) => count + 1)}>
                Retry
              </Button>
              <Button variant="secondary" onClick={() => navigate('/patient/requests')}>
                Back to My Requests
              </Button>
            </div>
          }
        />
      </motion.div>
    )
  }

  if (!result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <EmptyState
          icon={SearchX}
          title="Coordination data not found"
          description="No coordination information is available for this request."
          action={
            <Button onClick={() => navigate('/patient/requests')}>
              Back to My Requests
            </Button>
          }
        />
      </motion.div>
    )
  }

  const info = result.requestInfo || {}
  const selection = result.selection || {}
  const eligibility = result.eligibilityResult || {}
  const geo = result.geoResult || {}
  const agentStatus = result.agentStatus || {}
  const lifecycleLabel = {
    MATCHED: 'ACCEPTED',
    FULFILLED: 'FULFILLED',
  }
  const actionText = lifecycleLabel[info.status] || actionLabel[result.nextAction] || result.nextAction

  const isPendingVerification = info.status === 'PENDING_VERIFICATION'

  // Build map markers from request location
  const requestCoords = normalizeCoordinates(requestInfo?.location)
  const hospitalCoords = normalizeCoordinates(result?.hospital?.location)
  const bestDonorLocation = normalizeCoordinates(result?.bestDonor?.location)
  const backupDonorMarkers = (result?.backupDonors || []).map((donor) => {
    const donorCoords = normalizeCoordinates(donor.location)
    if (!donorCoords) return null
    return {
      ...donorCoords,
      type: 'donor',
      label: donor.name || donor.donorId || 'Nearby donor',
      sublabel: `${donor.bloodGroup || info.bloodGroup || '—'} · ${donor.distanceKm != null ? `${donor.distanceKm} km` : 'Nearby'}`,
    }
  }).filter(Boolean)

  const mapMarkers = [
    ...(requestCoords ? [{ ...requestCoords, type: 'request', label: 'Request', sublabel: `${info.bloodGroup || 'Blood'} · ${info.component || ''}` }] : []),
    ...(hospitalCoords ? [{ ...hospitalCoords, type: 'hospital', label: result?.hospital?.name || 'Hospital', sublabel: result?.hospital?.address || 'Hospital' }] : []),
    ...(bestDonorLocation ? [{ ...bestDonorLocation, type: 'bestMatch', label: result?.bestDonor?.name || 'Best donor', sublabel: `${result?.bestDonor?.bloodGroup || info.bloodGroup || '—'} · ${result?.bestDonor?.distanceKm ?? 'Nearby' } km` }] : []),
    ...backupDonorMarkers,
  ]

  const candidates = selection.selection?.candidates || []
  const recommendedCandidate = candidates.find(c => c.donorId === result.recommendedDonor)

  const matchingOutputs = [
    `Reviewed ${candidates.length} candidates`,
    `${candidates.filter(c => c.eligible).length} compatible`,
  ]
  if (selection.primary) {
    matchingOutputs.push(`Primary selected: ${selection.primary}`)
  }
  if (selection.decisive) {
    matchingOutputs.push('Decisive selection')
  }

  const eligibleCount = (eligibility.eligibleNow || []).length
  const eligibleLaterCount = (eligibility.eligibleLater || []).length
  const excludedCount = (eligibility.excluded || []).length

  const eligibilityOutputs = [
    `${eligibleCount} eligible now`,
    `${eligibleLaterCount} eligible later`,
    `${excludedCount} excluded`,
  ]

  const nearestCandidate = geo.estimated?.[0]
  const geoOutputs = [
    `${(geo.ordered || []).length} donors ranked by distance`,
  ]
  if (nearestCandidate) {
    geoOutputs.push(`Nearest: ${nearestCandidate.distanceKm} km, ETA ${nearestCandidate.etaMinutes} min`)
  }

  const managerOutputs = [
    `Risk: ${result.risk} (score ${result.riskScore})`,
    `Next action: ${result.nextAction}`,
  ]
  if (result.recommendedDonor) {
    const donorLabel = result.bestDonor?.name || 'Selected donor'
    managerOutputs.push(`Recommended: ${donorLabel}`)
  }

  const riskCard = {
    status: 'MONITORING',
    urgency: info.urgency || 'URGENT',
    advisory: result.explanation,
  }

  const bestMatch = result.bestDonor
    ? {
        id: result.bestDonor.donorId,
        name: result.bestDonor.name,
        bloodGroup: result.bestDonor.bloodGroup || info.bloodGroup || '—',
        donationType: result.bestDonor.component || info.component || 'Whole Blood',
        distance: result.bestDonor.distanceKm ?? recommendedCandidate?.distanceKm ?? nearestCandidate?.distanceKm ?? '—',
        etaMinutes: result.bestDonor.etaMinutes ?? nearestCandidate?.etaMinutes ?? null,
        matchScore: result.bestDonor.score ?? recommendedCandidate?.score ?? null,
        status: result.bestDonor.status || 'Available',
        factors: recommendedCandidate?.reasons || result.bestDonor?.reasons || ['Compatible', 'Eligible', 'Available'],
      }
    : null

  const notificationCard = {
    sentStatus: result.nextAction === 'CONTACT_PRIMARY_DONOR' ? 'SENT' : 'PENDING',
    responseStatus: actionText,
    wave: selection.wave || null,
    emailStatus: 'Not configured',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-5xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PageHeader
            title="AI Coordination"
            description="Five-agent coordination pipeline running server-side."
            onBack={() => navigate(`/patient/requests/${requestId}/tracking`)}
          />
        </div>
        <div className="flex items-center gap-2 self-start">
          <span className="text-sm text-text-muted">Request ID</span>
          <span className="text-sm font-semibold text-text-dark">{result.requestId}</span>
          <Badge variant={emergencyVariant[info.urgency] || 'neutral'}>{info.urgency || '—'}</Badge>
          <Badge variant="info">{actionText}</Badge>
        </div>
      </div>

      <Alert variant="info" className="text-xs">
        <span className="font-medium">Live orchestration.</span>{' '}
        All five agents run server-side: Donor Matching, Eligibility &amp; Scheduling,
        Geo Coordination, Risk &amp; Advisor, and AI Manager.
      </Alert>

      <div className="flex flex-wrap items-center gap-2 p-4 bg-white border border-border rounded-2xl shadow-card">
        <div className="w-9 h-9 rounded-lg bg-blood-soft flex items-center justify-center">
          <span className="text-xs font-bold text-blood">{info.bloodGroup || '—'}</span>
        </div>
        <span className="text-sm font-medium text-text-dark">{info.component || '—'}</span>
        <span className="text-xs text-text-muted">{info.unitsRequired ?? '—'} {info.unitsRequired === 1 ? 'unit' : 'units'}</span>
        <Badge variant={emergencyVariant[info.urgency] || 'neutral'}>{info.urgency || '—'}</Badge>
        <Badge variant="info">{actionText}</Badge>
      </div>

      {isPendingVerification && (
        <Alert variant="warning" className="text-xs">
          <span className="font-medium">Verification required.</span>{' '}
          This request must be verified by a hospital before the full AI coordination pipeline can begin matching donors.
        </Alert>
      )}

      {/* Location visualization */}
      <div>
        <BloodDropMap markers={mapMarkers} height="300px" />
        {nearestCandidate && (
          <p className="text-xs text-text-muted mt-2">
            Nearest donor: {nearestCandidate.distanceKm} km away, estimated ETA ~{nearestCandidate.etaMinutes} min (assumes {result.requestInfo?.assumedSpeedKmh || 25} km/h).
          </p>
        )}
      </div>

      <div className="space-y-1">
        <AIAgentCard
          icon={BrainCircuit}
          title="AI Manager"
          status={agentStatus.manager || (agentStatus.matching && agentStatus.eligibility && agentStatus.geo && agentStatus.risk ? 'COMPLETED' : 'PENDING')}
          description="Top-level coordination agent producing the final recommendation."
          outputs={managerOutputs}
        />

        <Connector />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AIAgentCard
          icon={Users}
          title="Donor Matching"
          status={agentStatus.matching || 'PENDING'}
          description="Selects primary and backup donors from scored candidates."
          outputs={matchingOutputs}
        >
            <div className="mt-3 pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-surface-soft rounded-lg">
                  <p className="text-lg font-bold text-text-dark">{candidates.length}</p>
                  <p className="text-[10px] text-text-muted">Reviewed</p>
                </div>
                <div className="text-center p-2 bg-surface-soft rounded-lg">
                  <p className="text-lg font-bold text-brand">{candidates.filter(c => c.eligible).length}</p>
                  <p className="text-[10px] text-text-muted">Compatible</p>
                </div>
              </div>
            </div>
          </AIAgentCard>

          <AIAgentCard
            icon={ShieldCheck}
            title="Eligibility &amp; Scheduling"
            status={agentStatus.eligibility || 'PENDING'}
            description="Per-donor eligibility assessment with timing details."
            outputs={eligibilityOutputs}
          >
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-center p-2 bg-surface-soft rounded-lg">
                <p className="text-lg font-bold text-brand">{eligibleCount}</p>
                <p className="text-[10px] text-text-muted">Eligible now</p>
              </div>
            </div>
          </AIAgentCard>

          <AIAgentCard
            icon={MapPin}
            title="Geo Coordination"
            status={agentStatus.geo || 'PENDING'}
            description="Distance-sorted ranking with ETA estimates."
            outputs={geoOutputs}
          >
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-center p-2 bg-surface-soft rounded-lg">
                <p className="text-lg font-bold text-brand">
                  {nearestCandidate ? `${nearestCandidate.distanceKm} km` : '—'}
                </p>
                <p className="text-[10px] text-text-muted">Nearest compatible</p>
              </div>
            </div>
          </AIAgentCard>
        </div>

        <Connector />

        {!result.recommendedDonor ? (
          <div className="p-6 bg-surface-soft border border-border rounded-2xl text-center">
            <SearchX className="w-8 h-8 text-text-light mx-auto mb-2" />
            <p className="text-sm font-medium text-text-dark">
              {result.nextAction === 'NO_ELIGIBLE_CANDIDATES'
                ? 'No eligible donors found'
                : result.nextAction === 'EXPAND_SEARCH'
                ? 'No candidates found — search radius should be expanded'
                : 'No donor recommendation available'}
            </p>
            <p className="text-xs text-text-muted mt-1">{result.explanation}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <BestMatchCard match={bestMatch} />
            </div>
            <div className="lg:col-span-1">
              <RiskAdvisorStatus risk={riskCard} />
            </div>
          </div>
        )}

        <Connector />

        <NotificationStatusCard notification={notificationCard} />
      </div>

      <div className="flex justify-center gap-3 pt-2 pb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/patient/requests/${requestId}/map`)}
        >
          View Nearby Donors on Map
        </Button>
      </div>

      <div className="flex justify-center pt-2 pb-4">
        <p className="text-xs text-text-muted text-center max-w-md">
          All five agents run server-side in the AI Orchestrator.
          Matching, eligibility, geolocation, risk assessment, and final recommendation
          are computed from real database data.
        </p>
      </div>
    </motion.div>
  )
}

export default AICoordination
