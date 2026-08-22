import { Users, UserCheck, FileText, Heart, Clock } from 'lucide-react'
import StatCard from '../ui/StatCard'

function AdminStatusGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total Users"
        value={stats.totalUsers.toLocaleString()}
        icon={Users}
        description="Registered users"
      />
      <StatCard
        title="Active Donors"
        value={stats.activeDonors.toLocaleString()}
        icon={UserCheck}
        description="Available donors"
      />
      <StatCard
        title="Blood Requests"
        value={stats.bloodRequests}
        icon={FileText}
        description="Active requests"
      />
      <StatCard
        title="Completed Donations"
        value={stats.completedDonations.toLocaleString()}
        icon={Heart}
        description="Successfully completed"
      />
      <StatCard
        title="Avg Response Time"
        value={`${stats.averageResponseMinutes} min`}
        icon={Clock}
        description="Average coordination"
      />
    </div>
  )
}

export default AdminStatusGrid
