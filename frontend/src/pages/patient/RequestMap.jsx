import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SearchX, Building2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import BloodDropMap from '../../components/maps/BloodDropMap'
import NearbyDonorList from '../../components/maps/NearbyDonorList'
import { demoMapData } from '../../data/demoMapData'

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
}

function RequestMap() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [selectedDonorId, setSelectedDonorId] = useState(null)
  const mapData = demoMapData[requestId]

  if (!mapData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <EmptyState
          icon={SearchX}
          title="Map data not found"
          description="No demo location information is available for this request."
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
      className="space-y-6 max-w-6xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Request Map"
          description="View the approximate coordination area, hospital destination, and nearby donor options for this request."
          onBack={() => navigate(`/patient/requests/${requestId}/tracking`)}
        />
        <div className="flex items-center gap-2 self-start">
          <span className="text-sm text-text-muted">Request ID</span>
          <span className="text-sm font-semibold text-text-dark">{mapData.requestId}</span>
          <Badge variant={emergencyVariant[mapData.emergencyLevel] || 'neutral'}>
            {mapData.emergencyLevel}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="info">{mapData.bloodGroup}</Badge>
        <Badge variant="neutral">{mapData.donationType}</Badge>
        <Badge variant="neutral">{mapData.units} {mapData.units === 1 ? 'unit' : 'units'}</Badge>
      </div>

      <Alert variant="info" className="text-xs">
        <span className="font-medium">Demo location view.</span>{' '}
        Locations and distances shown here are frontend demo data. No live donor tracking or Maps service is connected.
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BloodDropMap
            data={mapData}
            selectedDonorId={selectedDonorId}
            onSelectDonor={setSelectedDonorId}
          />
          <p className="text-[10px] text-text-muted mt-2">
            For privacy, donor locations are shown only as approximate coordination areas in this demo.
          </p>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card title="Nearby Donors">
            <NearbyDonorList
              donors={mapData.donors}
              selectedId={selectedDonorId}
              onSelect={setSelectedDonorId}
            />
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Hospital Destination</p>
                <p className="text-sm font-semibold text-text-dark">{mapData.hospital.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{mapData.hospital.area}</p>
                <p className="text-xs text-text-muted">{mapData.requestId}</p>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(`/patient/requests/${requestId}/tracking`)}
            >
              View Tracking
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(`/patient/requests/${requestId}/coordination`)}
            >
              View AI Coordination
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default RequestMap
