import { useState } from 'react'
import { motion } from 'framer-motion'
import Badge from '../../components/ui/Badge'
import DonorStatusGrid from '../../components/donor/DonorStatusGrid'
import DonorQuickActions from '../../components/donor/DonorQuickActions'
import NearbyRequests from '../../components/donor/NearbyRequests'
import DonorRecentNotifications from '../../components/donor/DonorRecentNotifications'
import { demoDonor, nearbyRequests, recentNotifications } from '../../data/demoDonorData'

function DonorDashboard() {
  const [available, setAvailable] = useState(demoDonor.availability)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text-dark">
              Welcome back, {demoDonor.name}
            </h1>
            <Badge variant="primary">DONOR</Badge>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Stay ready to donate and respond when someone nearby needs your help.
          </p>
        </div>
      </div>

      <DonorStatusGrid
        donor={demoDonor}
        available={available}
        onToggleAvailability={() => setAvailable((prev) => !prev)}
      />

      <div>
        <h2 className="text-lg font-semibold text-text-dark mb-3">Quick Actions</h2>
        <DonorQuickActions
          available={available}
          onToggleAvailability={() => setAvailable((prev) => !prev)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NearbyRequests requests={nearbyRequests} />
        </div>
        <div className="lg:col-span-1">
          <DonorRecentNotifications notifications={recentNotifications} />
        </div>
      </div>
    </motion.div>
  )
}

export default DonorDashboard
