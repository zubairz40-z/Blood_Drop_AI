import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'

const roleRoutes = {
  Donor: '/donor/notifications',
  Patient: '/patient/notifications',
  Hospital: '/hospital/notifications',
  Volunteer: '/volunteer/notifications',
  Admin: '/admin/notifications',
}

function NotificationBell({
  count = 0,
  notifications = [],
  role = 'Donor',
  className = '',
  onItemClick,
  onMarkAllRead,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const latest = notifications.slice(0, 5)
  const viewAllPath = roleRoutes[role] || '/donor/notifications'

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}
        aria-expanded={open}
        className="relative p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] ring-2 ring-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-2xl shadow-elevated overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-brand-soft/20">
            <p className="text-sm font-semibold text-brand">Notifications</p>
            {count > 0 && (
              <button
                onClick={() => {
                  onMarkAllRead?.()
                  setOpen(false)
                }}
                aria-label="Mark all as read"
                className="text-xs text-brand hover:text-brand-hover font-medium cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {latest.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-text-muted">No notifications yet</p>
              </div>
            ) : (
              latest.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  className={`px-4 py-3 border-b border-border last:border-b-0 hover:bg-neutral-50 transition-colors cursor-pointer ${
                    !n.read ? 'bg-brand-soft/30' : ''
                  }`}
                  onClick={() => {
                    setOpen(false)
                    onItemClick?.(n)
                    if (n.actionPath) navigate(n.actionPath)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setOpen(false)
                      onItemClick?.(n)
                      if (n.actionPath) navigate(n.actionPath)
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-text-dark' : 'text-text-charcoal'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />
                    )}
                  </div>
                  {n.timestamp && (
                    <p className="text-xs text-text-light mt-1">{n.timestamp}</p>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2.5 border-t border-border bg-surface-soft">
            <button
              onClick={() => {
                setOpen(false)
                navigate(viewAllPath)
              }}
              className="w-full text-center text-xs font-medium text-brand hover:text-brand-hover transition-colors cursor-pointer"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
