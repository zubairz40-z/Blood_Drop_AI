import { Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

function DonorRecentNotifications({ notifications = [] }) {
  return (
    <Card
      title="Recent Notifications"
      subtitle="Latest updates"
      className="h-full"
    >
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No recent notifications"
          description="You're all caught up. We'll notify you when something happens."
        />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              variants={item}
              className={`p-3 rounded-xl border transition-colors ${
                notification.unread
                  ? 'bg-brand-soft/20 border-brand-soft'
                  : 'bg-white border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                {notification.unread && (
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-charcoal leading-snug">
                    {notification.message}
                  </p>
                  <p className="text-xs text-text-light mt-1">{notification.time}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </Card>
  )
}

export default DonorRecentNotifications
