import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Sparkles } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { currentRequest, completedRequests } from '../../data/demoPatientData'

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
}

function PatientRequests() {
  const navigate = useNavigate()
  const hasActive = !!currentRequest

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl"
    >
      <PageHeader
        title="My Requests"
        description="View and track all your blood requests."
        onBack={() => navigate('/patient')}
      />

      <Card title="Active Requests">
        {!hasActive ? (
          <EmptyState
            title="No active requests"
            description="You currently have no active blood requests."
            action={
              <Button onClick={() => navigate('/patient/requests/create')}>
                Create Blood Request
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-surface-soft rounded-xl border border-border">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blood-soft flex items-center justify-center">
                  <span className="text-sm font-bold text-blood">{currentRequest.bloodGroup}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-dark">{currentRequest.id}</p>
                    <Badge variant={emergencyVariant[currentRequest.emergencyLevel] || 'neutral'}>
                      {currentRequest.emergencyLevel}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {currentRequest.donationType} · {currentRequest.units} {currentRequest.units === 1 ? 'unit' : 'units'} · {currentRequest.hospital}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-text-muted" />
                    <p className="text-xs text-text-muted">{currentRequest.location}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/patient/requests/${currentRequest.id}/tracking`)}
                >
                  Track Request
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Sparkles}
                  onClick={() => navigate(`/patient/requests/${currentRequest.id}/coordination`)}
                >
                  AI Coordination
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card title="Completed Requests">
        {completedRequests.length === 0 ? (
          <EmptyState
            title="No completed requests"
            description="Completed requests will appear here."
          />
        ) : (
          <div className="space-y-3">
            {completedRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-700">{req.bloodGroup}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-dark">{req.donationType}</p>
                    <p className="text-xs text-text-muted">
                      {req.units} {req.units === 1 ? 'unit' : 'units'} · {req.id} · {req.completedAt}
                    </p>
                  </div>
                </div>
                <Badge variant="success">COMPLETED</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default PatientRequests
