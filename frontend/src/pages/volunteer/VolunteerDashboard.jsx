import { useState } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import VolunteerStatusGrid from '../../components/volunteer/VolunteerStatusGrid'
import AssignedEmergencyCard from '../../components/volunteer/AssignedEmergencyCard'
import VolunteerDonorCard from '../../components/volunteer/VolunteerDonorCard'
import VolunteerHospitalCard from '../../components/volunteer/VolunteerHospitalCard'
import VolunteerActions from '../../components/volunteer/VolunteerActions'
import {
  demoVolunteer,
  demoAssignment,
  demoDonor,
  demoHospitalInfo,
} from '../../data/demoVolunteerData'

function VolunteerDashboard() {
  const [status, setStatus] = useState(demoVolunteer.assistanceStatus)

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
            <Badge variant="primary">VOLUNTEER</Badge>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VolunteerDonorCard donor={demoDonor} />
        <VolunteerHospitalCard hospital={demoHospitalInfo} />
      </div>

      <VolunteerActions status={status} onStatusChange={setStatus} />
    </motion.div>
  )
}

export default VolunteerDashboard
