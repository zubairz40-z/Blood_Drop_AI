import { FileText, CheckCircle, Clock, Users } from 'lucide-react'
import StatCard from '../ui/StatCard'

function PatientStatusGrid({ activeRequests, completedRequests, currentRequestId, matchedDonorCount }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Active Requests"
        value={activeRequests}
        icon={FileText}
        tone="blood"
        description="Currently in progress"
      />
      <StatCard
        title="Completed Requests"
        value={completedRequests}
        icon={CheckCircle}
        tone="success"
        description="Successfully fulfilled"
      />
      <StatCard
        title="Current Request"
        value={currentRequestId}
        icon={Clock}
        tone="info"
        description="Latest active request"
      />
      <StatCard
        title="Matched Donor"
        value={matchedDonorCount > 0 ? `${matchedDonorCount} donor` : 'None'}
        icon={Users}
        tone={matchedDonorCount > 0 ? 'success' : 'warning'}
        description={matchedDonorCount > 0 ? 'Donor matched' : 'Searching for donors'}
      />
    </div>
  )
}

export default PatientStatusGrid
