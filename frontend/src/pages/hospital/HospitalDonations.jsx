import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fetchPendingDonations, confirmDonation } from '../../api/donationApi'
import { toComponentLabel } from '../../api/mappers'

const statusVariant = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'error',
}

const pendingColumns = [
  {
    key: 'id',
    header: 'Donation ID',
    render: (val) => <span className="font-medium text-text-dark">{String(val).slice(-8)}</span>,
  },
  {
    key: 'donorName',
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
  {
    key: 'component',
    header: 'Component',
    render: (val) => toComponentLabel(val) || val,
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
  {
    key: 'donatedAt',
    header: 'Donated',
    render: (val) => val ? new Date(val).toLocaleDateString() : '—',
  },
]

function HospitalDonations() {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchPendingDonations()
      setDonations(data || [])
    } catch {
      // Leave state as-is
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    load().then(() => { if (cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [load])

  async function handleConfirm(donationId) {
    setConfirmingId(donationId)
    setError(null)
    try {
      const { requestStatus } = await confirmDonation(donationId)
      // Remove from pending list after confirmation
      setDonations((prev) => prev.filter((d) => d.id !== donationId))
      // Only say "fulfilled" when the request's real status backs it up.
      setFeedback(
        requestStatus === 'FULFILLED'
          ? 'Donation confirmed successfully. The blood request has been fulfilled.'
          : 'Donation confirmed successfully.'
      )
      setTimeout(() => setFeedback(null), 4000)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not confirm this donation.')
    } finally {
      setConfirmingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Donations" description="Loading..." />
        <div className="flex justify-center py-24">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  // Separate confirmed and pending
  const pending = donations.filter((d) => d.status === 'PENDING')
  const confirmed = donations.filter((d) => d.status !== 'PENDING')

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
            description="Track donation progress and confirm completed donations."
          />
          <Badge variant="role-hospital">Hospital</Badge>
        </div>
      </div>

      {feedback && (
        <Alert variant="success" onDismiss={() => setFeedback(null)}>
          {feedback}
        </Alert>
      )}
      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card title="Pending Confirmation">
        <Table
          columns={[
            ...pendingColumns,
            {
              key: '_actions',
              header: '',
              render: (_, row) => (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleConfirm(row.id)}
                  disabled={confirmingId === row.id}
                  loading={confirmingId === row.id}
                >
                  Confirm
                </Button>
              ),
            },
          ]}
          data={pending}
          rowKey="id"
          emptyMessage="No donations pending confirmation."
        />
      </Card>

      {confirmed.length > 0 && (
        <Card title="Confirmed Donations">
          <Table
            columns={pendingColumns}
            data={confirmed}
            rowKey="id"
            emptyMessage="No confirmed donations yet."
          />
        </Card>
      )}
    </motion.div>
  )
}

export default HospitalDonations
