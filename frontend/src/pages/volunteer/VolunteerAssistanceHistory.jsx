import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import Alert from '../../components/ui/Alert'
import { ClipboardList } from 'lucide-react'
import { fetchVolunteerHistory } from '../../api/volunteerApi'

const statusVariant = {
  COMPLETED: 'success',
}

const columns = [
  {
    key: '_id',
    header: 'Task ID',
    render: (val) => <span className="font-medium text-text-dark">{val}</span>,
  },
  {
    key: 'request',
    header: 'Request',
    render: (val) => (
      <span className="font-medium text-text-dark">
        {val?.bloodGroup || '—'} · {val?.component || '—'}
      </span>
    ),
  },
  {
    key: 'hospital',
    header: 'Hospital',
    render: (val) => val?.name || '—',
  },
  {
    key: 'type',
    header: 'Assistance Type',
  },
  {
    key: 'completedAt',
    header: 'Date',
    render: (val) =>
      val ? new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
  },
  {
    key: 'status',
    header: 'Status',
    render: (val) => <Badge variant={statusVariant[val] || 'neutral'}>{val}</Badge>,
  },
]

function VolunteerAssistanceHistory() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await fetchVolunteerHistory()
        setTasks(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load history.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner label="Loading history..." />
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <PageHeader
            title="Assistance History"
            description="Review your completed volunteer assistance tasks."
          />
          <Badge variant="role-volunteer">Volunteer</Badge>
        </div>
      </div>

      {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}

      {!error && tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No completed tasks yet"
          description="Your volunteer assistance history will appear here once you complete tasks."
        />
      ) : (
        <Table
          columns={columns}
          data={tasks}
          rowKey="_id"
          emptyMessage="No completed tasks yet."
        />
      )}
    </motion.div>
  )
}

export default VolunteerAssistanceHistory
