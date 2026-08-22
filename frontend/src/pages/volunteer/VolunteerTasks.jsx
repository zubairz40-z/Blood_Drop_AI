import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { demoVolunteerTasks } from '../../data/demoVolunteerPages'

const emergencyVariant = {
  CRITICAL: 'error',
  URGENT: 'warning',
  NORMAL: 'info',
}

function VolunteerTasks() {
  const navigate = useNavigate()

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
            title="Assigned Tasks"
            description="View your current and past volunteer assignments."
          />
          <Badge variant="role-volunteer">Volunteer</Badge>
        </div>
      </div>

      {demoVolunteerTasks.length > 0 ? (
        <Card title="Active Assignment">
          <div className="space-y-3">
            {demoVolunteerTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-surface-soft rounded-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blood-soft flex items-center justify-center">
                    <span className="text-sm font-bold text-blood">{task.bloodGroup}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-dark">{task.id}</p>
                      <Badge variant={emergencyVariant[task.emergencyLevel] || 'neutral'}>
                        {task.emergencyLevel}
                      </Badge>
                      <Badge variant="info">{task.status}</Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {task.donationType} · {task.units} {task.units === 1 ? 'unit' : 'units'} · {task.hospital} · {task.distance} km
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate('/volunteer')}>
                  View Assignment
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-text-muted text-center py-8">No active assignments.</p>
        </Card>
      )}
    </motion.div>
  )
}

export default VolunteerTasks
