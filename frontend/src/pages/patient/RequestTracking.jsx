import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SearchX, Sparkles } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import RequestTrackingTimeline from '../../components/patient/RequestTrackingTimeline'
import RequestTrackingSummary from '../../components/patient/RequestTrackingSummary'
import { demoRequestTracking } from '../../data/demoRequestTracking'

const statusVariant = {
  PENDING: 'neutral',
  MATCHING: 'info',
  'DONOR FOUND': 'success',
  'WAITING RESPONSE': 'warning',
  CONFIRMED: 'success',
  COMPLETED: 'success',
}

function RequestTracking() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const tracking = demoRequestTracking[requestId]

  if (!tracking) {
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
          description="This request could not be found in the current demo data."
          action={
            <Button onClick={() => navigate('/patient')}>
              Back to Patient Dashboard
            </Button>
          }
        />
      </motion.div>
    )
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
          description="Follow the coordination progress for your blood request."
          onBack={() => navigate('/patient/requests')}
        />
        <Badge variant={statusVariant[tracking.currentStage] || 'neutral'} className="self-start">
          {tracking.currentStage === 'WAITING_RESPONSE' ? 'WAITING RESPONSE' : tracking.currentStage}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-text-muted">Request ID</span>
        <span className="text-sm font-semibold text-text-dark">{tracking.requestId}</span>
        <Badge variant="info" className="ml-2">{tracking.bloodGroup}</Badge>
        <Badge variant="neutral">{tracking.donationType}</Badge>
        <Badge variant="neutral">{tracking.units} {tracking.units === 1 ? 'unit' : 'units'}</Badge>
        <Badge variant={tracking.emergencyLevel === 'CRITICAL' ? 'error' : tracking.emergencyLevel === 'URGENT' ? 'warning' : 'info'}>
          {tracking.emergencyLevel}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="sm"
          icon={Sparkles}
          onClick={() => navigate(`/patient/requests/${tracking.requestId}/coordination`)}
        >
          View AI Coordination
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Coordination Timeline">
            <RequestTrackingTimeline stages={tracking.stages} />
          </Card>
        </div>

        <div className="lg:col-span-1">
          <RequestTrackingSummary tracking={tracking} />
        </div>
      </div>
    </motion.div>
  )
}

export default RequestTracking
