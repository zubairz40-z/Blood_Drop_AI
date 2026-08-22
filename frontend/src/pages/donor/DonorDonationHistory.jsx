import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Card from '../../components/ui/Card'
import { demoDonationHistory } from '../../data/demoDonationHistory'

const statusVariant = {
  COMPLETED: 'success',
}

const columns = [
  {
    key: 'id',
    header: 'Donation ID',
    render: (val) => <span className="font-medium text-text-dark">{val}</span>,
  },
  { key: 'date', header: 'Date' },
  { key: 'hospital', header: 'Hospital' },
  { key: 'donationType', header: 'Type' },
  {
    key: 'bloodGroup',
    header: 'Blood Group',
    render: (val) => (
      <div className="w-9 h-9 rounded-lg bg-blood-soft flex items-center justify-center">
        <span className="text-xs font-bold text-blood">{val}</span>
      </div>
    ),
  },
  { key: 'units', header: 'Units', render: (val) => `${val} unit` },
  {
    key: 'status',
    header: 'Status',
    render: (val) => <Badge variant={statusVariant[val] || 'neutral'}>{val}</Badge>,
  },
  {
    key: 'nextEligibleDate',
    header: 'Next Eligible',
    render: (val) => <span className="text-emerald-600 font-medium">{val}</span>,
  },
]

function DonorDonationHistory() {
  const totalDonations = demoDonationHistory.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Donation History"
          description="Review your previous BloodDrop donation activity."
        />
        <Badge variant="role-donor">Donor</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-brand">{totalDonations}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-dark">Total Donations</p>
            <p className="text-xs text-text-muted mt-0.5">All completed donations</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-emerald-600">Now</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-dark">Next Eligible Date</p>
            <p className="text-xs text-emerald-600 mt-0.5 font-medium">Eligible now</p>
          </div>
        </Card>
      </div>

      <Table
        columns={columns}
        data={demoDonationHistory}
        rowKey="id"
        emptyMessage="No donations yet."
      />
    </motion.div>
  )
}

export default DonorDonationHistory
