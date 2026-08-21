import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Siren } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import EmergencyRequestCard from '../../components/donor/EmergencyRequestCard'
import { demoDonorRequests, emergencyLevelConfig } from '../../data/demoDonorRequests'

const filters = ['All', 'CRITICAL', 'URGENT', 'NORMAL']

function DonorEmergencyRequests() {
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredRequests = useMemo(() => {
    if (activeFilter === 'All') return demoDonorRequests
    return demoDonorRequests.filter((r) => r.emergencyLevel === activeFilter)
  }, [activeFilter])

  const pendingCount = demoDonorRequests.filter((r) => r.status === 'PENDING').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Emergency Requests"
          description="Review compatible blood requests near you and respond based on your availability."
        />
        <Badge variant="warning">Pending: {pendingCount}</Badge>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((filter) => {
          const config = filter !== 'All' ? emergencyLevelConfig[filter] : null
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                activeFilter === filter
                  ? 'bg-brand-soft border-brand text-brand'
                  : 'bg-white border-border text-text-secondary hover:bg-neutral-50'
              }`}
            >
              {filter === 'All' ? 'All' : config?.label || filter}
            </button>
          )
        })}
      </div>

      <Card>
        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={Siren}
            title="No emergency requests right now"
            description="Compatible requests will appear here when they become available."
          />
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <EmergencyRequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default DonorEmergencyRequests
