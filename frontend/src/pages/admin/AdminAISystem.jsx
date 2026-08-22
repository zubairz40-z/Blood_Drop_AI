import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import AISystemStatus from '../../components/admin/AISystemStatus'
import { demoAIAgents } from '../../data/demoAdminData'

function AdminAISystem() {
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
            title="AI System"
            description="Monitor the status of BloodDrop's internal AI coordination agents."
          />
          <Badge variant="role-admin">Admin</Badge>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Demo system status. Live agent health will be connected during backend/AI integration.
      </p>

      <div className="max-w-xl">
        <AISystemStatus agents={demoAIAgents} />
      </div>
    </motion.div>
  )
}

export default AdminAISystem
