import { Bell, Clock } from 'lucide-react'
import Badge from '../ui/Badge'

function NotificationStatusCard({ notification }) {
  if (!notification) return null

  return (
    <div className="bg-white border border-border rounded-2xl shadow-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-brand-soft rounded-xl">
          <Bell className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-dark">Notification Status</h3>
          <p className="text-xs text-text-muted">Donor notification wave</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-text-dark">Notification</span>
          </div>
          <Badge variant="success">{notification.sentStatus}</Badge>
        </div>

        <div className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-text-dark">Donor response</span>
          </div>
          <Badge variant="warning">{notification.responseStatus}</Badge>
        </div>

        {notification.emailStatus && (
          <div className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border">
            <span className="text-sm text-text-dark">Email</span>
            <Badge variant={notification.emailStatus === 'Email sent' ? 'success' : notification.emailStatus === 'Email failed' ? 'warning' : 'neutral'}>{notification.emailStatus}</Badge>
          </div>
        )}

        {notification.wave && (
          <div className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border">
            <span className="text-sm text-text-dark">Wave</span>
            <Badge variant="error">{notification.wave === 1 ? 'Primary donor' : `Backup #${notification.wave - 1}`}</Badge>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationStatusCard
