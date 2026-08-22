import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import RiskAdvisorPanel from '../../components/admin/RiskAdvisorPanel'
import { demoRiskAlerts, demoRiskSummary } from '../../data/demoAdminData'

function AdminRiskAlerts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <PageHeader
            title="Risk Alerts"
            description="System risk monitoring and suspicious activity alerts."
          />
          <Badge variant="role-admin">Admin</Badge>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Demo risk data. Real-time monitoring will be connected during backend integration.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-emerald-600">{demoRiskSummary.systemRisk}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-dark">System Risk</p>
            <p className="text-xs text-text-muted mt-0.5">Overall risk level</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-amber-600">{demoRiskSummary.suspiciousActivities}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-dark">Suspicious Activities</p>
            <p className="text-xs text-text-muted mt-0.5">Flagged for review</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-blue-600">{demoRiskSummary.recommendations}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-dark">Recommendations</p>
            <p className="text-xs text-text-muted mt-0.5">Pending actions</p>
          </div>
        </Card>
      </div>

      <RiskAdvisorPanel alerts={demoRiskAlerts} />
    </motion.div>
  )
}

export default AdminRiskAlerts
