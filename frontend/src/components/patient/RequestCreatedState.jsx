import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

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
          <p className="text-sm text-text-muted mt-2">
            Your request has been sent to the hospital for verification. You&apos;ll be notified once it&apos;s approved.
          </p>
        </div>

        <div className="bg-surface-soft rounded-xl p-4 mt-4 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Request ID</span>
            <span className="text-sm font-medium text-text-dark">{request.shortId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Status</span>
            <Badge variant={request.statusVariant}>{request.statusLabel}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Blood Group</span>
            <span className="text-sm font-medium text-text-dark">{request.bloodGroup}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Donation Type</span>
            <span className="text-sm font-medium text-text-dark">{request.componentLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Units</span>
            <span className="text-sm font-medium text-text-dark">{request.unitsRequired}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Urgency</span>
            <span className="text-sm font-medium text-text-dark">{request.urgencyLabel}</span>
          </div>
          {request.hospital?.name && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Hospital</span>
              <span className="text-sm font-medium text-text-dark">{request.hospital.name}</span>
            </div>
          )}
          {request.neededBy && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Needed By</span>
              <span className="text-sm font-medium text-text-dark">
                {request.neededBy.toLocaleString()}
              </span>
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
            onClick={() => navigate('/patient/requests')}
            className="flex-1"
          >
            View My Requests
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

export default RequestCreatedState