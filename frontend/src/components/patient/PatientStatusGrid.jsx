import { FileText, CheckCircle, Clock, Users } from 'lucide-react'
import StatCard from '../ui/StatCard'

function PatientStatusGrid({ activeRequests, completedRequests, currentRequestId, matchedDonorCount }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Active Requests"
        value={activeRequests}
        icon={FileText}
        description="Currently in progress"
      />
      <StatCard
        title="Completed Requests"
        value={completedRequests}
        icon={CheckCircle}
        description="Successfully fulfilled"
      />
      <StatCard
        title="Current Request"
        value={currentRequestId}
        icon={Clock}
        description="Latest active request"
      />
      <StatCard
        title="Matched Donor"
        value={matchedDonorCount > 0 ? `${matchedDonorCount} donor` : 'None'}
        icon={Users}
        description={matchedDonorCount > 0 ? 'Donor matched' : 'Searching for donors'}
      />
    </div>
  )
}

export default PatientStatusGrid
