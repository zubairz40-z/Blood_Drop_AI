import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import AdminStatusGrid from '../../components/admin/AdminStatusGrid'
import AdminRequestsChart from '../../components/admin/AdminRequestsChart'
import AdminDonationChart from '../../components/admin/AdminDonationChart'
import AdminDonationTypesChart from '../../components/admin/AdminDonationTypesChart'
import AdminEmergencyRequestsChart from '../../components/admin/AdminEmergencyRequestsChart'
import AISystemStatus from '../../components/admin/AISystemStatus'
import RiskAdvisorPanel from '../../components/admin/RiskAdvisorPanel'
import {
  demoAdminStats,
  demoRequestsByDay,
  demoDonationsByGroup,
  demoAIAgents,
  demoRiskAlerts,
  demoRecentActivity,
  demoDonationTypesBreakdown,
  demoEmergencyBreakdown,
} from '../../data/demoAdminData'

function AdminDashboard() {
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
              title="Admin Dashboard"
              description="Monitor BloodDrop activity, coordination health, and system-wide trends."
            />
            <Badge variant="primary">ADMIN</Badge>
          </div>
        </div>
      </div>

      <AdminStatusGrid stats={demoAdminStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminRequestsChart data={demoRequestsByDay} />
        <AdminDonationChart data={demoDonationsByGroup} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminDonationTypesChart data={demoDonationTypesBreakdown} />
        <AdminEmergencyRequestsChart data={demoEmergencyBreakdown} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AISystemStatus agents={demoAIAgents} />
        <RiskAdvisorPanel alerts={demoRiskAlerts} />
      </div>

      {demoRecentActivity.length > 0 && (
        <Card title="Recent Activity">
          <div className="space-y-3">
            {demoRecentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border"
              >
                <p className="text-sm text-text-dark">{item.message}</p>
                <span className="text-xs text-text-muted shrink-0 ml-4">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  )
}

export default AdminDashboard
