import { FileText, CheckCircle, Clock, Users } from 'lucide-react'
import StatCard from '../ui/StatCard'

function PatientStatusGrid({ activeRequests, completedRequests, currentRequestId, pendingCount }) {
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
        title="Awaiting Verification"
        value={pendingCount}
        icon={Users}
        tone={pendingCount > 0 ? 'warning' : 'success'}
        description={pendingCount > 0 ? 'With the hospital' : 'Nothing pending'}
      />
    </div>
  )
}

export default PatientStatusGrid
