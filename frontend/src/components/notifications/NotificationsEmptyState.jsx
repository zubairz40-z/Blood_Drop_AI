import { Bell } from 'lucide-react'
import EmptyState from '../ui/EmptyState'

function NotificationsEmptyState() {
  return (
    <EmptyState
      icon={Bell}
      title="No notifications yet"
      description="Updates related to your BloodDrop activity will appear here."
    />
  )
}

export default NotificationsEmptyState
