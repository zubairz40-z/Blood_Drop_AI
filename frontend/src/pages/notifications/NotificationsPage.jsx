import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CheckCheck } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import NotificationItem from '../../components/notifications/NotificationItem'
import NotificationFilters from '../../components/notifications/NotificationFilters'
import NotificationsEmptyState from '../../components/notifications/NotificationsEmptyState'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../api/notificationApi'

function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await fetchNotifications()
      setNotifications(result.notifications)
      setUnreadCount(result.unreadCount)
    } catch {
      // Leave state as-is on error; the user can retry
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    load().then(() => { if (cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [load])

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read)
    if (filter === 'read') return notifications.filter((n) => n.read)
    return notifications
  }, [notifications, filter])

  const counts = useMemo(() => ({
    all: notifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount,
  }), [notifications, unreadCount])

  async function handleMarkRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await markNotificationRead(id)
    } catch {
      // If backend fails, reload to re-sync
      load()
    }
  }

  async function handleMarkAllRead() {
    setMarking(true)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await markAllNotificationsRead()
    } catch {
      load()
    } finally {
      setMarking(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <PageHeader title="Notifications" description="Loading..." />
        <div className="flex justify-center py-24">
          <LoadingSpinner />
        </div>
      </div>
    )
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
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            icon={CheckCheck}
            onClick={handleMarkAllRead}
            disabled={marking}
            className="self-start"
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <NotificationFilters active={filter} onChange={setFilter} counts={counts} />
        {unreadCount > 0 && (
          <span className="text-xs text-text-muted">
            {unreadCount} unread
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
    </motion.div>
  )
}

export default NotificationsPage
