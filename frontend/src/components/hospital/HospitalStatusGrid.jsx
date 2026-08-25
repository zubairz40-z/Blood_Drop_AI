import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import StatCard from '../ui/StatCard'

function HospitalStatusGrid({ pendingCount, verifiedCount, activeRequests, emergencyCases }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Awaiting Verification"
        value={pendingCount}
        icon={Clock}
        tone={pendingCount > 0 ? 'warning' : 'success'}
        description="Needs your review"
      />
      <StatCard
        title="Verified"
        value={verifiedCount}
        icon={CheckCircle}
        tone="success"
        description="Approved by you"
      />
      <StatCard
        title="Active Requests"
        value={activeRequests}
        icon={FileText}
        tone="info"
        description="Currently in progress"
      />
      <StatCard
        title="Emergency Cases"
        value={emergencyCases}
        icon={AlertTriangle}
        tone="blood"
        description="Urgent & emergency"
      />
    </div>
  )
}

export default HospitalStatusGrid