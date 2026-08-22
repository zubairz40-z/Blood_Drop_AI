import { useState } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Alert from '../../components/ui/Alert'
import HospitalInventory from '../../components/hospital/HospitalInventory'
import { demoBloodInventory } from '../../data/demoHospitalData'

function HospitalInventoryPage() {
  const [inventory, setInventory] = useState(demoBloodInventory)
  const [alert, setAlert] = useState(null)

  function handleUpdateInventory(newInventory) {
    setInventory(newInventory)
    setAlert('Inventory updated for this demo session.')
    setTimeout(() => setAlert(null), 3000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <PageHeader
            title="Blood Inventory"
            description="Monitor and update blood unit availability across all groups."
          />
          <Badge variant="primary">HOSPITAL</Badge>
        </div>
      </div>

      {alert && (
        <Alert variant="success" onDismiss={() => setAlert(null)}>
          {alert}
        </Alert>
      )}

      <HospitalInventory inventory={inventory} onUpdateInventory={handleUpdateInventory} />
    </motion.div>
  )
}

export default HospitalInventoryPage
