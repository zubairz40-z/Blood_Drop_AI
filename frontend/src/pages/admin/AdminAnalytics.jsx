import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import AdminDonationTypesChart from '../../components/admin/AdminDonationTypesChart'
import AdminEmergencyRequestsChart from '../../components/admin/AdminEmergencyRequestsChart'
import {
  demoDonationsByMonth,
  demoDonationTypesBreakdown,
  demoEmergencyBreakdown,
} from '../../data/demoAdminData'

function AdminAnalytics() {
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
            title="Analytics"
            description="BloodDrop platform analytics and coordination insights."
          />
          <Badge variant="role-admin">Admin</Badge>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Demo analytics. Live data will be connected during backend integration.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Donations by Month">
          <div className="mt-2 space-y-3">
            {demoDonationsByMonth.map((item) => {
              const max = Math.max(...demoDonationsByMonth.map((d) => d.count), 1)
              return (
                <div key={item.month} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-10 shrink-0">{item.month}</span>
                  <div className="flex-1 bg-neutral-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${(item.count / max) * 100}%` }}
                    >
                      {item.count / max > 0.25 && (
                        <span className="text-[10px] font-semibold text-white">{item.count}</span>
                      )}
                    </div>
                  </div>
                  {item.count / max <= 0.25 && (
                    <span className="text-xs font-medium text-text-dark w-6 text-right">{item.count}</span>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <AdminDonationTypesChart data={demoDonationTypesBreakdown} />
      </div>

      <AdminEmergencyRequestsChart data={demoEmergencyBreakdown} />
    </motion.div>
  )
}

export default AdminAnalytics
