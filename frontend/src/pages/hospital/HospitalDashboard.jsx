import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import HospitalStatusGrid from '../../components/hospital/HospitalStatusGrid'
import HospitalActiveRequests from '../../components/hospital/HospitalActiveRequests'
import HospitalMatchedDonors from '../../components/hospital/HospitalMatchedDonors'
import HospitalInventory from '../../components/hospital/HospitalInventory'
import HospitalEmergencyCases from '../../components/hospital/HospitalEmergencyCases'
import HospitalCreateRequestModal from '../../components/hospital/HospitalCreateRequestModal'
import {
  demoHospital,
  demoActiveRequests,
  demoMatchedDonors,
  demoBloodInventory,
} from '../../data/demoHospitalData'

function HospitalDashboard() {
  const [activeRequests, setActiveRequests] = useState(demoActiveRequests)
  const [matchedDonors, setMatchedDonors] = useState(demoMatchedDonors)
  const [bloodInventory, setBloodInventory] = useState(demoBloodInventory)
  const [createOpen, setCreateOpen] = useState(false)
  const [donationsToday] = useState(demoHospital.donationsToday)
  const [alert, setAlert] = useState(null)

  const emergencyCases = activeRequests.filter(
    (r) => r.emergencyLevel === 'CRITICAL' || r.emergencyLevel === 'URGENT'
  )

  function handleConfirmDonor(donorId) {
    setMatchedDonors((prev) =>
      prev.map((d) => (d.id === donorId ? { ...d, status: 'CONFIRMED' } : d))
    )
    setAlert('Donor confirmed for this demo session.')
    setTimeout(() => setAlert(null), 3000)
  }

  function handleUpdateInventory(newInventory) {
    setBloodInventory(newInventory)
    setAlert('Inventory updated for this demo session.')
    setTimeout(() => setAlert(null), 3000)
  }

  function handleCreateRequest(data) {
    const newId = `REQ-H-DEMO-${300 + activeRequests.length + 1}`
    setActiveRequests((prev) => [
      {
        id: newId,
        ...data,
        status: 'MATCHING',
        createdAt: 'Just now',
      },
      ...prev,
    ])
    setAlert(`Request ${newId} created for this demo session.`)
    setTimeout(() => setAlert(null), 3000)
  }

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
              title="Hospital Dashboard"
              description="Manage blood requests, donor matches, donations, and inventory from one place."
            />
            <Badge variant="role-hospital">Hospital</Badge>
          </div>
        </div>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Create Request
        </Button>
      </div>

      {alert && (
        <Alert variant="success" onDismiss={() => setAlert(null)}>
          {alert}
        </Alert>
      )}

      <HospitalStatusGrid
        activeRequests={activeRequests.length}
        matchedDonors={matchedDonors.length}
        donationsToday={donationsToday}
        emergencyCases={emergencyCases.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HospitalActiveRequests requests={activeRequests} />
        </div>
        <div className="lg:col-span-1">
          <HospitalEmergencyCases requests={activeRequests} />
        </div>
      </div>

      <HospitalMatchedDonors
        donors={matchedDonors}
        onConfirmDonor={handleConfirmDonor}
      />

      <HospitalInventory
        inventory={bloodInventory}
        onUpdateInventory={handleUpdateInventory}
      />

      <HospitalCreateRequestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreateRequest={handleCreateRequest}
      />
    </motion.div>
  )
}

export default HospitalDashboard
