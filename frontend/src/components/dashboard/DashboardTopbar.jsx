import { useState, useEffect, useCallback } from 'react'
import { Menu } from 'lucide-react'
import NotificationBell from '../common/NotificationBell'
import DashboardProfileMenu from './DashboardProfileMenu'
import { useAuth } from '../../context/AuthContext'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../api/notificationApi'

// How often the bell polls for new notifications. Matches the cadence
// RequestTracking already uses for its own status refresh.
const POLL_MS = 8000

function DashboardTopbar({ roleLabel = 'Donor', onMenuClick }) {
  const { profile } = useAuth()
  const name = profile?.name || 'User'
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const load = useCallback(async () => {
    try {
      const result = await fetchNotifications()
      setNotifications(result.notifications)
      setUnreadCount(result.unreadCount)
    } catch {
      // Keep whatever we last had if a poll fails
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  async function handleItemClick(n) {
    if (n.read) return
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await markNotificationRead(n.id)
    } catch {
      load()
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await markAllNotificationsRead()
    } catch {
      load()
    }
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 bg-brand border-b border-brand/20 lg:pl-[260px]">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-white">{roleLabel} Dashboard</h2>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell
          count={unreadCount}
          notifications={notifications}
          role={roleLabel}
          onItemClick={handleItemClick}
          onMarkAllRead={handleMarkAllRead}
        />
        <DashboardProfileMenu name={name} role={roleLabel} />
      </div>
    </header>
  )
}

export default DashboardTopbar
