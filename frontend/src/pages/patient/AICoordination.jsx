import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BrainCircuit, Users, ShieldCheck, MapPin, ArrowDown, SearchX, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import AIAgentCard from '../../components/ai/AIAgentCard'
import BestMatchCard from '../../components/ai/BestMatchCard'
import RiskAdvisorStatus from '../../components/ai/RiskAdvisorStatus'
import NotificationStatusCard from '../../components/ai/NotificationStatusCard'
import { coordinateBloodRequest } from '../../api/aiApi'
import { fetchRequestById } from '../../api/requestApi'
import { mockMatchResult } from '../../mocks/milestoneC/matchMock'
import { bloodRequestFromApi, toUrgencyCode } from '../../api/mappers'

// Temporary eligibility/geo structured input until Arefa's real agents are merged
const TEMP_ELIGIBILITY = {
  eligibleDonorIds: mockMatchResult.candidates.filter(c => c.eligible).map(c => c.donorId),
}
const TEMP_GEO = {
  rankedDonorIds: mockMatchResult.candidates.map(c => c.donorId),
}

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
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
        // First fetch the real request so we can pass accurate metadata to the orchestrator
        const reqData = await fetchRequestById(requestId)
        if (cancelled) return
        const mapped = bloodRequestFromApi(reqData)
        setRequestInfo(mapped)

        const payload = {
          request: {
            id: requestId,
            urgency: toUrgencyCode(mapped.urgency),
            bloodGroup: mapped.bloodGroup,
            component: mapped.component,
            unitsRequired: mapped.unitsRequired,
          },
          // temporary structured data until Arefa's real agents are merged
          matchingResult: mockMatchResult,
          eligibilityResult: TEMP_ELIGIBILITY,
          geoResult: TEMP_GEO,
          riskContext: {
            requestCountRecent: 0,
            emergencyRequestsRecent: 0,
            cancelledRequestsRecent: 0,
            donorActivityCount: 0,
            emergencyResponseMinutes: 0,
            bloodGroupDemandCount: 0,
          },
        }

        const data = await coordinateBloodRequest(payload)
        if (!cancelled) setResult(data)
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

  // --- loading ---
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

  // --- error ---
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

  // --- no result (should not happen, but guard) ---
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

  // --- Build card data from real orchestrator output ---
  const actionText = actionLabel[result.nextAction] || result.nextAction
  const eligibleCount = result.eligibilityResult?.eligibleDonorIds?.length || 0
  const nearestCandidate = mockMatchResult.candidates.find(c => c.donorId === result.recommendedDonor)
  const nearestDistance = nearestCandidate?.distanceKm ?? '—'

  const managerOutputs = [
    `Risk assessed: ${result.risk} (score ${result.riskScore})`,
    `Next action: ${result.nextAction}`,
  ]
  if (result.recommendedDonor) {
    managerOutputs.push(`Recommended donor selected`)
  }

  const matchingCandidatesReviewed = mockMatchResult.candidates.length
  const matchingCompatible = mockMatchResult.candidates.filter(c => c.eligible).length

  const managerCard = {
    status: 'COMPLETED',
    description: 'The coordination workflow has been processed by the AI Orchestrator.',
    outputs: managerOutputs,
  }

  const matchingCard = {
    status: 'COMPLETED',
    description: 'Compatible donor candidates reviewed (temporary structured input).',
    candidatesReviewed: matchingCandidatesReviewed,
    compatibleCandidates: matchingCompatible,
    criteria: ['Blood compatibility', 'Donation type', 'Availability'],
  }

  const eligibilityCard = {
    status: 'COMPLETED',
    description: 'Candidate eligibility reviewed (temporary structured input).',
    eligibleCandidates: eligibleCount,
  }

  const geoCard = {
    status: 'COMPLETED',
    description: 'Nearby candidate distances compared (temporary structured input).',
    nearestDistance,
  }

  const riskCard = {
    status: 'MONITORING',
    urgency: 'URGENT',
    advisory: result.explanation,
  }

  const bestMatch = result.recommendedDonor
    ? {
        id: result.recommendedDonor,
        bloodGroup: 'O+',
        donationType: 'Whole Blood',
        distance: nearestCandidate?.distanceKm ?? '—',
        availability: 'Available',
        factors: nearestCandidate?.reasons || ['Compatible', 'Eligible', 'Available'],
      }
    : null

  const notificationCard = {
    sentStatus: result.nextAction === 'CONTACT_PRIMARY_DONOR' ? 'SENT' : 'PENDING',
    responseStatus: result.nextAction === 'CONTACT_PRIMARY_DONOR' ? 'WAITING RESPONSE' : actionText,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-5xl"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PageHeader
            title="AI Coordination"
            description="See how BloodDrop coordinates matching, eligibility, location, and donor response for this request."
            onBack={() => navigate(`/patient/requests/${requestId}/tracking`)}
          />
        </div>
        <div className="flex items-center gap-2 self-start">
          <span className="text-sm text-text-muted">Request ID</span>
          <span className="text-sm font-semibold text-text-dark">{result.requestId}</span>
          <Badge variant={emergencyVariant[requestInfo?.urgency] || 'neutral'}>{requestInfo?.urgency || 'URGENT'}</Badge>
          <Badge variant="info">{actionText}</Badge>
        </div>
      </div>

      <Alert variant="info" className="text-xs">
        <span className="font-medium">Live orchestration.</span>{' '}
        AI Manager and Risk &amp; Advisor are running through the backend orchestrator.
        Matching, eligibility and geo outputs are using temporary contract data until the remaining agents are integrated.
      </Alert>

      {/* Request summary bar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-white border border-border rounded-2xl shadow-card">
        <div className="w-9 h-9 rounded-lg bg-blood-soft flex items-center justify-center">
          <span className="text-xs font-bold text-blood">{requestInfo?.bloodGroup || '—'}</span>
        </div>
        <span className="text-sm font-medium text-text-dark">{requestInfo?.componentLabel || '—'}</span>
        <span className="text-xs text-text-muted">{requestInfo?.unitsRequired ?? '—'} {requestInfo?.unitsRequired === 1 ? 'unit' : 'units'}</span>
        <Badge variant={emergencyVariant[requestInfo?.urgency] || 'neutral'}>{requestInfo?.urgency || '—'}</Badge>
        <Badge variant="info">{actionText}</Badge>
        <span className="text-xs text-text-muted ml-auto">{requestInfo?.hospital?.name || '—'}</span>
      </div>

      {/* Agent flow */}
      <div className="space-y-1">
        <AIAgentCard
          icon={BrainCircuit}
          title="AI Manager"
          status={managerCard.status}
          description={managerCard.description}
          outputs={managerCard.outputs}
        />

        <Connector />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AIAgentCard
            icon={Users}
            title="Donor Matching"
            status={matchingCard.status}
            description={matchingCard.description}
          >
            <div className="mt-3 pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-surface-soft rounded-lg">
                  <p className="text-lg font-bold text-text-dark">{matchingCard.candidatesReviewed}</p>
                  <p className="text-[10px] text-text-muted">Reviewed</p>
                </div>
                <div className="text-center p-2 bg-surface-soft rounded-lg">
                  <p className="text-lg font-bold text-brand">{matchingCard.compatibleCandidates}</p>
                  <p className="text-[10px] text-text-muted">Compatible</p>
                </div>
              </div>
              {matchingCard.criteria && (
                <ul className="mt-3 space-y-1">
                  {matchingCard.criteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                      <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </AIAgentCard>

          <AIAgentCard
            icon={ShieldCheck}
            title="Eligibility & Scheduling"
            status={eligibilityCard.status}
            description={eligibilityCard.description}
          >
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-center p-2 bg-surface-soft rounded-lg">
                <p className="text-lg font-bold text-brand">{eligibilityCard.eligibleCandidates}</p>
                <p className="text-[10px] text-text-muted">Eligible candidates</p>
              </div>
            </div>
          </AIAgentCard>

          <AIAgentCard
            icon={MapPin}
            title="Geo Coordination"
            status={geoCard.status}
            description={geoCard.description}
          >
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-center p-2 bg-surface-soft rounded-lg">
                <p className="text-lg font-bold text-brand">{geoCard.nearestDistance} km</p>
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

      {/* Footer */}
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
          AI Manager and Risk &amp; Advisor are live backend modules. Matching, eligibility and geo outputs are temporary structured inputs until Arefa&apos;s agents are merged.
        </p>
      </div>
    </motion.div>
  )
}

export default AICoordination
