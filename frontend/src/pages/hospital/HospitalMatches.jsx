import { useState } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Alert from '../../components/ui/Alert'
import HospitalMatchedDonors from '../../components/hospital/HospitalMatchedDonors'
import { demoMatchedDonors } from '../../data/demoHospitalData'

function HospitalMatches() {
  const [donors, setDonors] = useState(demoMatchedDonors)
  const [alert, setAlert] = useState(null)

  function handleConfirmDonor(donorId) {
    setDonors((prev) =>
      prev.map((d) => (d.id === donorId ? { ...d, status: 'CONFIRMED' } : d))
    )
    setAlert('Donor confirmed for this demo session.')
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
            title="Matched Donors"
            description="Donors matched to your hospital's active blood requests."
          />
          <Badge variant="primary">HOSPITAL</Badge>
        </div>
      </div>

      {alert && (
        <Alert variant="success" onDismiss={() => setAlert(null)}>
          {alert}
        </Alert>
      )}

      <HospitalMatchedDonors donors={donors} onConfirmDonor={handleConfirmDonor} />
    </motion.div>
  )
}

export default HospitalMatches
