import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Card from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fetchMyDonations } from '../../api/donationApi'
import { toComponentLabel } from '../../api/mappers'

const statusVariant = {
  CONFIRMED: 'success',
  PENDING: 'warning',
  CANCELLED: 'error',
}

const columns = [
  {
    key: 'id',
    header: 'Donation ID',
    render: (val) => <span className="font-medium text-text-dark">{String(val).slice(-8)}</span>,
  },
  {
    key: 'donatedAt',
    header: 'Date',
    render: (val) => val ? new Date(val).toLocaleDateString() : '—',
  },
  { key: 'hospitalName', header: 'Hospital' },
  {
    key: 'component',
    header: 'Type',
    render: (val) => toComponentLabel(val) || val,
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
  {
    key: 'units',
    header: 'Units',
    render: (val) => `${val} unit${val === 1 ? '' : 's'}`,
  },
  {
    key: 'status',
    header: 'Status',
    render: (val) => <Badge variant={statusVariant[val] || 'neutral'}>{val}</Badge>,
  },
]

function DonorDonationHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchMyDonations().then((data) => {
      if (!cancelled) {
        setHistory(data)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Donation History" description="Loading..." />
        <div className="flex justify-center py-24">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  const confirmedCount = history.filter((d) => d.status === 'CONFIRMED').length

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
            <span className="text-xl font-bold text-brand">{history.length}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-dark">Total Donations</p>
            <p className="text-xs text-text-muted mt-0.5">All recorded donations</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-emerald-600">{confirmedCount}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-dark">Confirmed</p>
            <p className="text-xs text-emerald-600 mt-0.5 font-medium">Completed donations</p>
          </div>
        </Card>
      </div>

      <Table
        columns={columns}
        data={history}
        rowKey="id"
        emptyMessage="No donations yet."
      />
    </motion.div>
  )
}

export default DonorDonationHistory
