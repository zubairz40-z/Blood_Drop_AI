import { Bell } from 'lucide-react'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'

function PatientRecentNotifications({ notifications = [] }) {
  return (
    <Card className="h-full">
      <h3 className="text-base font-semibold text-text-dark mb-4">Recent Notifications</h3>
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No recent notifications"
          description="Notifications will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-xl border ${
                n.unread
                  ? 'bg-brand-soft/30 border-brand-soft'
                  : 'bg-white border-border'
              }`}
            >
              <p className="text-sm text-text-dark leading-snug">{n.message}</p>
              <p className="text-xs text-text-muted mt-1">{n.time}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default PatientRecentNotifications
