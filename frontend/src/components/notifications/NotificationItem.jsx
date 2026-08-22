import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Info, Bell, ShieldAlert } from 'lucide-react'
import Button from '../ui/Button'

const typeIcons = {
  emergency: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
  system: ShieldAlert,
}

const typeColors = {
  emergency: 'text-blood bg-blood-soft',
  warning: 'text-amber-600 bg-amber-50',
  success: 'text-emerald-600 bg-emerald-50',
  info: 'text-blue-600 bg-blue-50',
  system: 'text-brand bg-brand-soft',
}

function NotificationItem({ notification, onMarkRead }) {
  const navigate = useNavigate()
  const Icon = typeIcons[notification.type] || Bell
  const colors = typeColors[notification.type] || 'text-text-muted bg-neutral-100'

  function handleClick() {
    if (!notification.read) {
      onMarkRead(notification.id)
    }
    if (notification.actionPath) {
      navigate(notification.actionPath)
    }
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
        notification.read
          ? 'bg-white border-border hover:bg-neutral-50'
          : 'bg-brand-soft/20 border-brand-soft/50 hover:bg-brand-soft/30'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
    >
      <div className={`p-2 rounded-lg shrink-0 ${colors}`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${notification.read ? 'text-text-secondary font-medium' : 'text-text-dark font-semibold'}`}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-text-muted mt-0.5">{notification.message}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-text-light">{notification.timestamp}</span>
          {notification.actionLabel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                navigate(notification.actionPath)
              }}
              className="text-xs h-6 px-2"
            >
              {notification.actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationItem
