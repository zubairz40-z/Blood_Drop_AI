import { useState, useEffect } from 'react'
import { Droplets, Search } from 'lucide-react'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fetchAllRequests } from '../../api/adminApi'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'MATCHING', label: 'Matching' },
  { value: 'MATCHED', label: 'Matched' },
  { value: 'FULFILLED', label: 'Fulfilled' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' },
]

const URGENCY_OPTIONS = [
  { value: '', label: 'All Urgency' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'ROUTINE', label: 'Routine' },
]

const statusVariant = {
  PENDING_VERIFICATION: 'warning',
  VERIFIED: 'info',
  MATCHING: 'info',
  MATCHED: 'primary',
  FULFILLED: 'success',
  CANCELLED: 'neutral',
  REJECTED: 'error',
  EXPIRED: 'neutral',
}

const urgencyVariant = {
  EMERGENCY: 'error',
  URGENT: 'warning',
  ROUTINE: 'info',
}

function AdminBloodRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadRequests()
  }, [statusFilter, urgencyFilter])

  async function loadRequests() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAllRequests({
        status: statusFilter,
        urgency: urgencyFilter,
        search,
      })
      setRequests(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load blood requests.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    loadRequests()
  }

  const columns = [
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      render: (bg) => <span className="font-semibold text-blood">{bg}</span>,
    },
    {
      key: 'component',
      header: 'Component',
      render: (c) => <span className="capitalize">{c}</span>,
    },
    { key: 'unitsRequired', header: 'Units' },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (u) => <Badge variant={urgencyVariant[u] || 'neutral'}>{u}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <Badge variant={statusVariant[s] || 'neutral'}>{s?.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'hospital',
      header: 'Hospital',
      render: (h) => h?.name || <span className="text-text-light">—</span>,
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (p, row) => p?.name || row.patientName || <span className="text-text-light">—</span>,
    },
    {
      key: 'neededBy',
      header: 'Needed By',
      render: (d) => d ? new Date(d).toLocaleDateString() : <span className="text-text-light">—</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (d) => new Date(d).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark mb-1">Blood Requests</h1>
        <p className="text-sm text-text-muted">
          System-wide blood request management. View and monitor all requests across hospitals.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1">
          <Input
            icon={Search}
            placeholder="Search by blood group, patient, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <select
          className="select select-bordered border-border-dark rounded-xl text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="select select-bordered border-border-dark rounded-xl text-sm"
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
        >
          {URGENCY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Droplets}
          title="No requests found"
          description="There are no blood requests matching your filters."
        />
      ) : (
        <>
          <p className="text-xs text-text-muted">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>
          <Table columns={columns} data={requests} rowKey="_id" />
        </>
      )}
    </div>
  )
}

export default AdminBloodRequests
