import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Sparkles } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
}

function RequestCreatedState({ request }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="max-w-lg mx-auto text-center">
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-text-dark">Request Created</h2>
          <div className="flex items-center gap-2 mt-2">
            <Sparkles className="w-4 h-4 text-brand" />
            <p className="text-sm font-medium text-brand">AI coordination started</p>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Your blood request has been prepared for coordination in this demo session.
          </p>
        </div>

        <div className="bg-surface-soft rounded-xl p-4 mt-4 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Request ID</span>
            <span className="text-sm font-medium text-text-dark">{request.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Blood Group</span>
            <span className="text-sm font-medium text-text-dark">{request.bloodGroup}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Donation Type</span>
            <span className="text-sm font-medium text-text-dark">{request.donationType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Units</span>
            <span className="text-sm font-medium text-text-dark">{request.units}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Emergency Level</span>
            <Badge variant={emergencyVariant[request.emergencyLevel] || 'neutral'}>
              {request.emergencyLevel}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Hospital</span>
            <span className="text-sm font-medium text-text-dark">{request.hospital}</span>
          </div>
          {request.location && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Location</span>
              <span className="text-sm font-medium text-text-dark">{request.location}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => navigate('/patient')}
            className="flex-1"
          >
            Back to Dashboard
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            Create Another Request
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

export default RequestCreatedState
