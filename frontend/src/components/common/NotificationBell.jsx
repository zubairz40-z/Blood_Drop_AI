import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'

function NotificationBell({ count = 0, notifications = [], className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

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

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}
        aria-expanded={open}
        className="relative p-2 rounded-xl text-text-muted hover:text-text-dark hover:bg-neutral-100 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-2xl shadow-elevated overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-text-dark">Notifications</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-text-muted">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={n.id || i}
                  className={`px-4 py-3 border-b border-border last:border-b-0 hover:bg-neutral-50 transition-colors ${
                    n.unread ? 'bg-brand-soft/30' : ''
                  }`}
                >
                  <p className="text-sm text-text-charcoal">{n.message}</p>
                  {n.time && (
                    <p className="text-xs text-text-light mt-1">{n.time}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
