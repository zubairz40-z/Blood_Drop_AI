import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import NearbyRequestCard from './NearbyRequestCard'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

function NearbyRequests({ requests = [] }) {
  return (
    <Card
      title="Nearby Requests"
      subtitle="Blood requests matching your type"
      className="h-full"
    >
      {requests.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No nearby requests right now"
          description="We'll show compatible requests here when they become available."
        />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {requests.map((request) => (
            <motion.div key={request.id} variants={item}>
              <NearbyRequestCard request={request} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </Card>
  )
}

export default NearbyRequests
