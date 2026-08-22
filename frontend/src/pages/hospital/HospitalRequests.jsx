import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import HospitalActiveRequests from '../../components/hospital/HospitalActiveRequests'
import HospitalCreateRequestModal from '../../components/hospital/HospitalCreateRequestModal'
import { demoActiveRequests } from '../../data/demoHospitalData'

function HospitalRequests() {
  const [requests, setRequests] = useState(demoActiveRequests)
  const [createOpen, setCreateOpen] = useState(false)
  const [alert, setAlert] = useState(null)

  function handleCreateRequest(data) {
    const newId = `REQ-H-DEMO-${300 + requests.length + 1}`
    setRequests((prev) => [
      { id: newId, ...data, status: 'MATCHING', createdAt: 'Just now' },
      ...prev,
    ])
    setCreateOpen(false)
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
              title="Blood Requests"
              description="View and manage all active blood requests for your hospital."
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

      <HospitalActiveRequests requests={requests} />

      <HospitalCreateRequestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreateRequest={handleCreateRequest}
      />
    </motion.div>
  )
}

export default HospitalRequests
