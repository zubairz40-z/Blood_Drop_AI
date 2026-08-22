import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import PatientStatusGrid from '../../components/patient/PatientStatusGrid'
import CurrentRequestCard from '../../components/patient/CurrentRequestCard'
import MatchedDonorCard from '../../components/patient/MatchedDonorCard'
import CompletedRequests from '../../components/patient/CompletedRequests'
import PatientRecentNotifications from '../../components/patient/PatientRecentNotifications'
import {
  demoPatient,
  currentRequest,
  matchedDonor,
  completedRequests,
  patientNotifications,
} from '../../data/demoPatientData'

function PatientDashboard() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PageHeader
              title="Patient Dashboard"
              description="Create and monitor blood requests from one place."
            />
            <Badge variant="primary">PATIENT</Badge>
          </div>
        </div>
        <Button
          icon={Plus}
          onClick={() => navigate('/patient/requests/create')}
        >
          Create Blood Request
        </Button>
      </div>

      <PatientStatusGrid
        activeRequests={demoPatient.activeRequests}
        completedRequests={demoPatient.completedRequests}
        currentRequestId={currentRequest?.id || '—'}
        matchedDonorCount={matchedDonor ? 1 : 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CurrentRequestCard request={currentRequest} />
        </div>
        <div className="lg:col-span-1">
          <MatchedDonorCard donor={matchedDonor} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompletedRequests requests={completedRequests} />
        <PatientRecentNotifications notifications={patientNotifications} />
      </div>
    </motion.div>
  )
}

export default PatientDashboard
