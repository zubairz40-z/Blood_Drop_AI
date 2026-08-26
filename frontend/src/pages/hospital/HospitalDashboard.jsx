import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardCheck } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import HospitalStatusGrid from '../../components/hospital/HospitalStatusGrid'
import HospitalActiveRequests from '../../components/hospital/HospitalActiveRequests'
import HospitalEmergencyCases from '../../components/hospital/HospitalEmergencyCases'
import { fetchMyRequests } from '../../api/requestApi'
import { bloodRequestFromApi } from '../../api/mappers'

const TERMINAL_STATUSES = ['FULFILLED', 'CANCELLED', 'REJECTED', 'EXPIRED']

function HospitalDashboard() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const list = await fetchMyRequests()
        if (!cancelled) setRequests(list.map(bloodRequestFromApi))
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load requests.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const active = requests.filter((r) => !TERMINAL_STATUSES.includes(r.status))
  const pending = requests.filter((r) => r.status === 'PENDING_VERIFICATION')
  const verified = requests.filter((r) => r.status === 'VERIFIED')
  const emergencies = active.filter(
    (r) => r.urgency === 'EMERGENCY' || r.urgency === 'URGENT'
  )

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <PageHeader
            title="Hospital Dashboard"
            description="Verify incoming patient requests and track their progress."
          />
          <Badge variant="role-hospital">Hospital</Badge>
        </div>
        <Button icon={ClipboardCheck} onClick={() => navigate('/hospital/requests')}>
          Verification Queue
          {pending.length > 0 && ` (${pending.length})`}
        </Button>
      </div>

      {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}

      <HospitalStatusGrid
        pendingCount={pending.length}
        verifiedCount={verified.length}
        activeRequests={active.length}
        emergencyCases={emergencies.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HospitalActiveRequests requests={active} />
        </div>
        <div className="lg:col-span-1">
          <HospitalEmergencyCases requests={active} />
        </div>
      </div>
    </motion.div>
  )
}

export default HospitalDashboard