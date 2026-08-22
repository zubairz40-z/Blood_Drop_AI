import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCheck } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/ui/Button'
import NotificationItem from '../../components/notifications/NotificationItem'
import NotificationFilters from '../../components/notifications/NotificationFilters'
import NotificationsEmptyState from '../../components/notifications/NotificationsEmptyState'
import { demoNotifications } from '../../data/demoNotifications'

function NotificationsPage() {
  const { role } = useParams()
  const [notifications, setNotifications] = useState(demoNotifications[role] || [])
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read)
    if (filter === 'read') return notifications.filter((n) => n.read)
    return notifications
  }, [notifications, filter])

  const counts = useMemo(() => ({
    all: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    read: notifications.filter((n) => n.read).length,
  }), [notifications])

  function handleMarkRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-3xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Notifications"
          description="Stay updated on requests, coordination activity, and important BloodDrop events."
        />
        {counts.unread > 0 && (
          <Button
            size="sm"
            variant="outline"
            icon={CheckCheck}
            onClick={handleMarkAllRead}
            className="self-start"
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <NotificationFilters active={filter} onChange={setFilter} counts={counts} />
        {counts.unread > 0 && (
          <span className="text-xs text-text-muted">
            {counts.unread} unread
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <NotificationsEmptyState />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}

      <div className="pt-2 pb-4">
        <p className="text-xs text-text-muted text-center">
          Frontend demo notifications only — no push service, WebSocket, Firebase, email, SMS, or backend notification system is connected.
        </p>
      </div>
    </motion.div>
  )
}

export default NotificationsPage
