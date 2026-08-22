import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import { demoVolunteerCompletedTasks } from '../../data/demoVolunteerPages'

const statusVariant = {
  COMPLETED: 'success',
}

const columns = [
  {
    key: 'id',
    header: 'Task ID',
    render: (val) => <span className="font-medium text-text-dark">{val}</span>,
  },
  {
    key: 'requestId',
    header: 'Request',
    render: (val) => <span className="font-medium text-text-dark">{val}</span>,
  },
  { key: 'hospital', header: 'Hospital' },
  { key: 'assistanceType', header: 'Assistance Type' },
  { key: 'date', header: 'Date' },
  {
    key: 'status',
    header: 'Status',
    render: (val) => <Badge variant={statusVariant[val] || 'neutral'}>{val}</Badge>,
  },
]

function VolunteerAssistanceHistory() {
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

      <Table
        columns={columns}
        data={demoVolunteerCompletedTasks}
        rowKey="id"
        emptyMessage="No completed tasks yet."
      />
    </motion.div>
  )
}

export default VolunteerAssistanceHistory
