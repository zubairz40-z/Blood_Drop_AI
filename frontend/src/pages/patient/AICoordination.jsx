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

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [aiResult, reqData] = await Promise.all([
          coordinateBloodRequest(requestId),
          fetchRequestById(requestId).catch(() => null),
        ])
        if (!cancelled) {
          setResult(aiResult)
          if (reqData) setRequestInfo(bloodRequestFromApi(reqData))
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
            <Button onClick={() => navigate('/patient/requests')}>
              Back to My Requests
            </Button>
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

  const actionText = actionLabel[result.nextAction] || result.nextAction
  const info = result.requestInfo || {}
  const selection = result.selection || {}
  const eligibility = result.eligibilityResult || {}
  const geo = result.geoResult || {}
  const agentStatus = result.agentStatus || {}

  // Build map markers from request location
  const requestCoords = normalizeCoordinates(requestInfo?.location)
  const mapMarkers = requestCoords
    ? [{ ...requestCoords, type: 'request', label: info.bloodGroup || 'Request', sublabel: info.component || '' }]
    : []

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
    managerOutputs.push(`Recommended: ${result.recommendedDonor}`)
  }

  const riskCard = {
    status: 'MONITORING',
    urgency: info.urgency || 'URGENT',
    advisory: result.explanation,
  }

  const bestMatch = result.recommendedDonor
    ? {
        id: result.recommendedDonor,
        bloodGroup: info.bloodGroup || '—',
        donationType: info.component || '—',
        distance: recommendedCandidate?.distanceKm ?? nearestCandidate?.distanceKm ?? '—',
        availability: 'Available',
        factors: recommendedCandidate?.reasons || ['Compatible', 'Eligible', 'Available'],
      }
    : null

  const notificationCard = {
    sentStatus: result.nextAction === 'CONTACT_PRIMARY_DONOR' ? 'SENT' : 'PENDING',
    responseStatus: actionText,
    wave: selection.wave || null,
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
          status={agentStatus.manager || 'COMPLETED'}
          description="Top-level coordination agent producing the final recommendation."
          outputs={managerOutputs}
        />

        <Connector />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AIAgentCard
            icon={Users}
            title="Donor Matching"
            status={agentStatus.matching === 'COMPLETED' ? 'COMPLETED' : agentStatus.matching || 'PENDING'}
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
            status={agentStatus.eligibility === 'COMPLETED' ? 'COMPLETED' : agentStatus.eligibility || 'PENDING'}
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
            status={agentStatus.geo === 'COMPLETED' ? 'COMPLETED' : agentStatus.geo || 'PENDING'}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <BestMatchCard match={bestMatch} />
          </div>
          <div className="lg:col-span-1">
            <RiskAdvisorStatus risk={riskCard} />
          </div>
        </div>

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
