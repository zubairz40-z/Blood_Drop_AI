import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, FileText } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import PatientStatusGrid from '../../components/patient/PatientStatusGrid'
import CurrentRequestCard from '../../components/patient/CurrentRequestCard'
import CompletedRequests from '../../components/patient/CompletedRequests'
import { fetchMyRequests } from '../../api/requestApi'
import { bloodRequestFromApi } from '../../api/mappers'

const TERMINAL_STATUSES = ['FULFILLED', 'CANCELLED', 'REJECTED', 'EXPIRED']

function PatientDashboard() {
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
        if (!cancelled) setError(err.response?.data?.message || 'Could not load your requests.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const active = requests.filter((r) => !TERMINAL_STATUSES.includes(r.status))
  const completed = requests.filter((r) => r.status === 'FULFILLED')
  const pending = requests.filter((r) => r.status === 'PENDING_VERIFICATION')

  // Requests come back newest-first from the API
  const current = active[0] || null

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
            title="Patient Dashboard"
            description="Create and monitor blood requests from one place."
          />
          <Badge variant="role-patient">Patient</Badge>
        </div>
        <Button icon={Plus} onClick={() => navigate('/patient/requests/create')}>
          Create Blood Request
        </Button>
      </div>

      {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}

      <PatientStatusGrid
        activeRequests={active.length}
        completedRequests={completed.length}
        currentRequestId={current?.shortId || '—'}
        pendingCount={pending.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {current ? (
            <CurrentRequestCard request={current} />
          ) : (
            <Card className="h-full">
              <EmptyState
                icon={FileText}
                title="No active requests"
                description="Create a blood request and it will appear here."
                action={
                  <Button onClick={() => navigate('/patient/requests/create')}>
                    Create Blood Request
                  </Button>
                }
              />
            </Card>
          )}
        </div>
        <div className="lg:col-span-1">
          <CompletedRequests requests={completed} />
        </div>
      </div>
    </motion.div>
  )
}

export default PatientDashboard