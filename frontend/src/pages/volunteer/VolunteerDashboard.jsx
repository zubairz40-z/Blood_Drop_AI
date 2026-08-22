import { useState } from 'react'
import { motion } from 'framer-motion'
import { Map } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import VolunteerStatusGrid from '../../components/volunteer/VolunteerStatusGrid'
import AssignedEmergencyCard from '../../components/volunteer/AssignedEmergencyCard'
import VolunteerDonorCard from '../../components/volunteer/VolunteerDonorCard'
import VolunteerHospitalCard from '../../components/volunteer/VolunteerHospitalCard'
import VolunteerActions from '../../components/volunteer/VolunteerActions'
import VolunteerMapModal from '../../components/volunteer/VolunteerMapModal'
import {
  demoVolunteer,
  demoAssignment,
  demoDonor,
  demoHospitalInfo,
} from '../../data/demoVolunteerData'

function VolunteerDashboard() {
  const [status, setStatus] = useState(demoVolunteer.assistanceStatus)
  const [mapOpen, setMapOpen] = useState(false)

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
        <Badge variant="info" className="self-start">{status}</Badge>
      </div>

      <VolunteerStatusGrid
        assignedTasks={demoVolunteer.assignedTasks}
        activeEmergency={demoVolunteer.activeEmergency}
        currentDistance={demoVolunteer.currentDistance}
        assistanceStatus={status}
      />

      <AssignedEmergencyCard assignment={demoAssignment} />

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
        <VolunteerDonorCard donor={demoDonor} />
        <VolunteerHospitalCard hospital={demoHospitalInfo} />
      </div>

      <VolunteerActions status={status} onStatusChange={setStatus} />

      <VolunteerMapModal open={mapOpen} onClose={() => setMapOpen(false)} />
    </motion.div>
  )
}

export default VolunteerDashboard
