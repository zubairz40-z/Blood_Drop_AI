import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Map } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Alert from '../../components/ui/Alert'
import VolunteerStatusGrid from '../../components/volunteer/VolunteerStatusGrid'
import AssignedEmergencyCard from '../../components/volunteer/AssignedEmergencyCard'
import VolunteerDonorCard from '../../components/volunteer/VolunteerDonorCard'
import VolunteerHospitalCard from '../../components/volunteer/VolunteerHospitalCard'
import VolunteerActions from '../../components/volunteer/VolunteerActions'
import VolunteerMapModal from '../../components/volunteer/VolunteerMapModal'
import { fetchVolunteerDashboard, fetchMyVolunteerTasks } from '../../api/volunteerApi'

function VolunteerDashboard() {
  const [stats, setStats] = useState({ assigned: 0, inProgress: 0, completed: 0, total: 0 })
  const [activeTask, setActiveTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mapOpen, setMapOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [dashStats, myTasks] = await Promise.all([
          fetchVolunteerDashboard(),
          fetchMyVolunteerTasks(),
        ])
        setStats(dashStats)
        // Find the first in-progress or assigned task to display as active
        const current = myTasks.find(
          (t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED'
        )
        setActiveTask(current || null)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner label="Loading dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Volunteer Dashboard"
          description="Assist donors and hospitals during active blood donation coordination."
        />
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }

  const assistanceStatus = activeTask
    ? activeTask.status.replace('_', ' ')
    : 'No Active Task'

  const emergencyLevel = activeTask
    ? activeTask.urgency
    : 'None'

  const donor = activeTask?.donor
    ? {
        id: activeTask.donor._id || activeTask.donor.name || 'N/A',
        bloodGroup: activeTask.request?.bloodGroup || 'N/A',
        donationType: activeTask.request?.component || 'N/A',
        availability: 'Assigned',
      }
    : null

  const hospital = activeTask?.hospital
    ? {
        name: activeTask.hospital.name || 'N/A',
        location: activeTask.hospital.address || 'N/A',
        distance: '—',
      }
    : null

  // Map to the shape AssignedEmergencyCard expects
  const assignment = activeTask
    ? {
        requestId: activeTask._id,
        bloodGroup: activeTask.request?.bloodGroup || 'N/A',
        donationType: activeTask.request?.component || 'N/A',
        units: activeTask.request?.unitsRequired || 1,
        emergencyLevel: activeTask.urgency,
        status: activeTask.status,
      }
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PageHeader
              title="Volunteer Dashboard"
              description="Assist donors and hospitals during active blood donation coordination."
            />
            <Badge variant="role-volunteer">Volunteer</Badge>
          </div>
        </div>
        <Badge variant="info" className="self-start">{assistanceStatus}</Badge>
      </div>

      <VolunteerStatusGrid
        assignedTasks={stats.assigned + stats.inProgress}
        activeEmergency={emergencyLevel}
        currentDistance="—"
        assistanceStatus={assistanceStatus}
      />

      <AssignedEmergencyCard assignment={assignment} />

      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          icon={Map}
          onClick={() => setMapOpen(true)}
        >
          View Coordination Map
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VolunteerDonorCard donor={donor} />
        <VolunteerHospitalCard hospital={hospital} />
      </div>

      <VolunteerActions status={assistanceStatus} onStatusChange={() => {}} />

      <VolunteerMapModal open={mapOpen} onClose={() => setMapOpen(false)} task={activeTask} />
    </motion.div>
  )
}

export default VolunteerDashboard
