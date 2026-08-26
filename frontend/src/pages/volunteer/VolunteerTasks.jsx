import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import Alert from '../../components/ui/Alert'
import { Inbox } from 'lucide-react'
import { fetchVolunteerTasks, acceptVolunteerTask } from '../../api/volunteerApi'

const urgencyVariant = {
  EMERGENCY: 'error',
  URGENT: 'warning',
  ROUTINE: 'info',
}

const statusVariant = {
  OPEN: 'success',
  ASSIGNED: 'info',
  IN_PROGRESS: 'warning',
}

function VolunteerTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [acceptingId, setAcceptingId] = useState(null)

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchVolunteerTasks()
        setTasks(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tasks.')
      } finally {
        setLoading(false)
      }
    }
    loadTasks()
  }, [])

  async function handleAccept(taskId) {
    if (acceptingId) return
    try {
      setAcceptingId(taskId)
      await acceptVolunteerTask(taskId)
      // Remove the accepted task from the open list
      setTasks((prev) => prev.filter((t) => t._id !== taskId))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept task.')
    } finally {
      setAcceptingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner label="Loading tasks..." />
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
            title="Available Tasks"
            description="View and accept open volunteer tasks."
          />
          <Badge variant="role-volunteer">Volunteer</Badge>
        </div>
      </div>

      {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}

      {tasks.length > 0 ? (
        <Card title="Open Tasks">
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center justify-between p-4 bg-surface-soft rounded-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blood-soft flex items-center justify-center">
                    <span className="text-sm font-bold text-blood">
                      {task.request?.bloodGroup || '—'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-dark">{task.title || task._id}</p>
                      <Badge variant={urgencyVariant[task.urgency] || 'neutral'}>
                        {task.urgency}
                      </Badge>
                      <Badge variant={statusVariant[task.status] || 'neutral'}>
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {task.type} · {task.request?.component || '—'} ·{' '}
                      {task.request?.unitsRequired || 1}{' '}
                      {(task.request?.unitsRequired || 1) === 1 ? 'unit' : 'units'} ·{' '}
                      {task.hospital?.name || '—'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  loading={acceptingId === task._id}
                  disabled={acceptingId !== null}
                  onClick={() => handleAccept(task._id)}
                >
                  Accept
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        !error && (
          <EmptyState
            icon={Inbox}
            title="No open tasks"
            description="There are no volunteer tasks available right now. Check back later."
          />
        )
      )}
    </motion.div>
  )
}

export default VolunteerTasks
