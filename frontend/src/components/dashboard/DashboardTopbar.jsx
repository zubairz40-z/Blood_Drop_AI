import { Menu } from 'lucide-react'
import NotificationBell from '../common/NotificationBell'
import DashboardProfileMenu from './DashboardProfileMenu'
import { demoNotifications } from '../../data/demoNotifications'
import { useAuth } from '../../context/AuthContext'

const roleKeyMap = {
  Donor: 'donor',
  Patient: 'patient',
  Hospital: 'hospital',
  Volunteer: 'volunteer',
  Admin: 'admin',
}

function DashboardTopbar({ roleLabel = 'Donor', onMenuClick }) {
  const { profile } = useAuth()
  const name = profile?.name || 'User'
  const roleKey = roleKeyMap[roleLabel] || 'donor'
  const notifications = demoNotifications[roleKey] || []
  const unreadCount = notifications.filter((n) => !n.read).length

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
        />
        <DashboardProfileMenu name={name} role={roleLabel} />
      </div>
    </header>
  )
}

export default DashboardTopbar
