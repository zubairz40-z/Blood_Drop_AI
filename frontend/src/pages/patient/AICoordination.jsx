import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SearchX } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import AICoordinationFlow from '../../components/ai/AICoordinationFlow'
import { demoAICoordination } from '../../data/demoAICoordination'

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
}

const statusVariant = {
  WAITING_RESPONSE: 'warning',
  MATCHING: 'info',
  'DONOR FOUND': 'success',
  CONFIRMED: 'success',
  COMPLETED: 'success',
}

function AICoordination() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const coordination = demoAICoordination[requestId]

  if (!coordination) {
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
          description="No demo coordination information is available for this request."
          action={
            <Button onClick={() => navigate('/patient/requests')}>
              Back to My Requests
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
        <div>
          <PageHeader
            title="AI Coordination"
            description="See how BloodDrop coordinates matching, eligibility, location, and donor response for this request."
            onBack={() => navigate(`/patient/requests/${requestId}/tracking`)}
          />
        </div>
        <div className="flex items-center gap-2 self-start">
          <span className="text-sm text-text-muted">Request ID</span>
          <span className="text-sm font-semibold text-text-dark">{coordination.requestId}</span>
          <Badge variant={emergencyVariant[coordination.emergencyLevel] || 'neutral'}>
            {coordination.emergencyLevel}
          </Badge>
          <Badge variant={statusVariant[coordination.status] || 'neutral'}>
            {coordination.status === 'WAITING_RESPONSE' ? 'WAITING RESPONSE' : coordination.status}
          </Badge>
        </div>
      </div>

      <Alert variant="info" className="text-xs">
        <span className="font-medium">Demo coordination view.</span>{' '}
        This frontend currently visualizes the planned BloodDrop AI workflow. Live agent execution will be connected during backend and AI integration.
      </Alert>

      <div className="flex flex-wrap items-center gap-2 p-4 bg-white border border-border rounded-2xl shadow-card">
        <div className="w-9 h-9 rounded-lg bg-blood-soft flex items-center justify-center">
          <span className="text-xs font-bold text-blood">{coordination.bloodGroup}</span>
        </div>
        <span className="text-sm font-medium text-text-dark">{coordination.donationType}</span>
        <span className="text-xs text-text-muted">{coordination.units} {coordination.units === 1 ? 'unit' : 'units'}</span>
        <Badge variant={emergencyVariant[coordination.emergencyLevel] || 'neutral'}>
          {coordination.emergencyLevel}
        </Badge>
        <Badge variant={statusVariant[coordination.status] || 'neutral'}>
          {coordination.status === 'WAITING_RESPONSE' ? 'Waiting Response' : coordination.status}
        </Badge>
        <span className="text-xs text-text-muted ml-auto">{coordination.hospital}</span>
      </div>

      <AICoordinationFlow coordination={coordination} />

      <div className="flex justify-center pt-2 pb-4">
        <p className="text-xs text-text-muted text-center max-w-md">
          Frontend demo coordination only — live agent execution and backend synchronization are not connected.
        </p>
      </div>
    </motion.div>
  )
}

export default AICoordination
