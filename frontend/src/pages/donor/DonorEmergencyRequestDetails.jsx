import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Droplets,
  HeartPulse,
  Building2,
  MapPin,
  Clock,
  Boxes,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { demoDonorRequests, emergencyLevelConfig, statusConfig } from '../../data/demoDonorRequests'

function DonorEmergencyRequestDetails() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [requests, setRequests] = useState(demoDonorRequests)
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [declineModalOpen, setDeclineModalOpen] = useState(false)

  const request = requests.find((r) => r.id === requestId)

  if (!request) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Request not found"
        description="This emergency request could not be found."
        action={
          <Button onClick={() => navigate('/donor/requests')}>
            Back to Emergency Requests
          </Button>
        }
      />
    )
  }

  const emergency = emergencyLevelConfig[request.emergencyLevel] || emergencyLevelConfig.NORMAL
  const status = statusConfig[request.status] || statusConfig.PENDING
  const isPending = request.status === 'PENDING'

  function handleAccept() {
    setRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: 'ACCEPTED' } : r)),
    )
    setAcceptModalOpen(false)
  }

  function handleDecline() {
    setRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: 'DECLINED' } : r)),
    )
    setDeclineModalOpen(false)
  }

  const infoItems = [
    { icon: Droplets, label: 'Donation Type', value: request.donationType },
    { icon: Boxes, label: 'Units Needed', value: `${request.units} ${request.units === 1 ? 'unit' : 'units'}` },
    { icon: Building2, label: 'Hospital', value: request.hospital },
    { icon: MapPin, label: 'Distance', value: `${request.distance} km away` },
    { icon: Clock, label: 'Requested', value: request.requestedAt },
    { icon: HeartPulse, label: 'Status', value: status.label },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Emergency Request"
          description={request.id}
          onBack={() => navigate('/donor/requests')}
          action={<Badge variant={emergency.variant}>{emergency.label}</Badge>}
        />
      </div>

      {request.status !== 'PENDING' && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          request.status === 'ACCEPTED'
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-blood-soft border-blood/20'
        }`}>
          {request.status === 'ACCEPTED' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-blood flex-shrink-0" />
          )}
          <div>
            <p className={`text-sm font-semibold ${
              request.status === 'ACCEPTED' ? 'text-emerald-800' : 'text-blood-dark'
            }`}>
              {request.status === 'ACCEPTED' ? 'Request Accepted' : 'Request Declined'}
            </p>
            <p className={`text-xs mt-0.5 ${
              request.status === 'ACCEPTED' ? 'text-emerald-700' : 'text-blood'
            }`}>
              {request.status === 'ACCEPTED'
                ? 'You accepted this request for this demo session. Hospital coordination will appear here after backend integration.'
                : 'This request was declined for the current demo session.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-blood-soft flex items-center justify-center">
                <span className="text-3xl font-bold text-blood">{request.bloodGroup}</span>
              </div>
              <h3 className="text-lg font-semibold text-text-dark mt-4">{request.donationType}</h3>
              <p className="text-sm text-text-muted mt-1">{request.units} {request.units === 1 ? 'unit' : 'units'} needed</p>
              <div className="mt-3">
                <Badge variant={emergency.variant}>{emergency.label}</Badge>
              </div>
              <p className="text-xs text-text-muted mt-2">{emergency.description}</p>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card title="Request Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoItems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="p-2 bg-neutral-100 rounded-lg flex-shrink-0">
                      <Icon className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">{item.label}</p>
                      <p className="text-sm font-medium text-text-dark mt-0.5">{item.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {request.location && (
            <Card title="Location">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-text-muted flex-shrink-0" />
                <p className="text-sm text-text-dark">{request.hospital}</p>
              </div>
              <p className="text-sm text-text-secondary mt-1 ml-6">{request.location}</p>
            </Card>
          )}

          {request.note && (
            <Card title="Request Note">
              <p className="text-sm text-text-secondary leading-relaxed">{request.note}</p>
            </Card>
          )}

          {isPending && (
            <Card>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-end">
                <p className="text-sm text-text-muted mr-auto">Ready to respond?</p>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setDeclineModalOpen(true)}
                    className="flex-1 sm:flex-none"
                  >
                    Decline
                  </Button>
                  <Button
                    onClick={() => setAcceptModalOpen(true)}
                    className="flex-1 sm:flex-none"
                  >
                    Accept Request
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title="Accept this emergency request?"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAcceptModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAccept}>Accept Request</Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          You're confirming that you're available to respond to this request. No backend notification will be sent at this time.
        </p>
      </Modal>

      <Modal
        open={declineModalOpen}
        onClose={() => setDeclineModalOpen(false)}
        title="Decline this request?"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeclineModalOpen(false)}>
              Keep Request
            </Button>
            <Button variant="danger" onClick={handleDecline}>
              Decline
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          You won't be marked as responding to this request. This action is local to this demo session.
        </p>
      </Modal>
    </motion.div>
  )
}

export default DonorEmergencyRequestDetails
