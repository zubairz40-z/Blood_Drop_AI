import { FileText, Users, Droplets, AlertTriangle } from 'lucide-react'
import StatCard from '../ui/StatCard'

function HospitalStatusGrid({ activeRequests, matchedDonors, donationsToday, emergencyCases }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Active Requests"
        value={activeRequests}
        icon={FileText}
        description="Currently in progress"
      />
      <StatCard
        title="Matched Donors"
        value={matchedDonors}
        icon={Users}
        description="Donors matched"
      />
      <StatCard
        title="Donations Today"
        value={donationsToday}
        icon={Droplets}
        description="Completed today"
      />
      <StatCard
        title="Emergency Cases"
        value={emergencyCases}
        icon={AlertTriangle}
        description="Urgent & critical"
      />
    </div>
  )
}

export default HospitalStatusGrid
