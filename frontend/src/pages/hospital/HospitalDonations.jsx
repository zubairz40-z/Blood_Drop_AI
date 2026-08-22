import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import { demoInProgressDonations, demoCompletedDonations } from '../../data/demoHospitalData'

const statusVariant = {
  'IN PROGRESS': 'warning',
  COMPLETED: 'success',
}

const inProgressColumns = [
  {
    key: 'id',
    header: 'Request',
    render: (val) => <span className="font-medium text-text-dark">{val}</span>,
  },
  {
    key: 'donorId',
    header: 'Donor',
    render: (val) => <span className="font-medium text-text-dark">{val}</span>,
  },
  {
    key: 'bloodGroup',
    header: 'Blood Group',
    render: (val) => (
      <div className="w-9 h-9 rounded-lg bg-blood-soft flex items-center justify-center">
        <span className="text-xs font-bold text-blood">{val}</span>
      </div>
    ),
  },
  { key: 'donationType', header: 'Donation Type' },
  {
    key: 'status',
    header: 'Status',
    render: (val) => <Badge variant={statusVariant[val] || 'neutral'}>{val}</Badge>,
  },
  { key: 'startedAt', header: 'Started' },
]

const completedColumns = [
  {
    key: 'id',
    header: 'Request',
    render: (val) => <span className="font-medium text-text-dark">{val}</span>,
  },
  {
    key: 'bloodGroup',
    header: 'Blood Group',
    render: (val) => (
      <div className="w-9 h-9 rounded-lg bg-blood-soft flex items-center justify-center">
        <span className="text-xs font-bold text-blood">{val}</span>
      </div>
    ),
  },
  { key: 'donationType', header: 'Type' },
  {
    key: 'donorId',
    header: 'Donor',
    render: (val) => <span className="font-medium text-text-dark">{val}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (val) => <Badge variant={statusVariant[val] || 'neutral'}>{val}</Badge>,
  },
  { key: 'completedAt', header: 'Completed' },
]

function HospitalDonations() {
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
            title="Donations"
            description="Track donation progress and completed donations."
          />
          <Badge variant="primary">HOSPITAL</Badge>
        </div>
      </div>

      <Card title="Donation In Progress">
        <Table
          columns={inProgressColumns}
          data={demoInProgressDonations}
          rowKey="id"
          emptyMessage="No donations currently in progress."
        />
      </Card>

      <Card title="Completed Donations">
        <Table
          columns={completedColumns}
          data={demoCompletedDonations}
          rowKey="id"
          emptyMessage="No completed donations yet."
        />
      </Card>
    </motion.div>
  )
}

export default HospitalDonations
