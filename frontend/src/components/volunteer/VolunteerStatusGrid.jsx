import { ClipboardList, AlertTriangle, MapPin, Activity } from 'lucide-react'
import StatCard from '../ui/StatCard'

function VolunteerStatusGrid({ assignedTasks, activeEmergency, currentDistance, assistanceStatus }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Assigned Tasks"
        value={assignedTasks}
        icon={ClipboardList}
        description="Currently assigned"
      />
      <StatCard
        title="Active Emergency"
        value={activeEmergency}
        icon={AlertTriangle}
        description="Emergency level"
      />
      <StatCard
        title="Current Distance"
        value={`${currentDistance} km`}
        icon={MapPin}
        description="To destination"
      />
      <StatCard
        title="Assistance Status"
        value={assistanceStatus}
        icon={Activity}
        description="Current task phase"
      />
    </div>
  )
}

export default VolunteerStatusGrid
