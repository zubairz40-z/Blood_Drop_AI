import { useState, useEffect } from 'react'
import { UserCheck, Check, X } from 'lucide-react'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fetchPendingAccounts, approveAccount, rejectAccount } from '../../api/adminApi'

function AdminUsers() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [actingOn, setActingOn] = useState(null) // id of the row being processed

  useEffect(() => {
    loadPending()
  }, [])

  async function loadPending() {
    setLoading(true)
    setError('')
    try {
      const users = await fetchPendingAccounts()
      setPending(users)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load pending accounts.')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(user) {
    setActingOn(user._id)
    setError('')
    setNotice('')
    try {
      await approveAccount(user._id)
      setPending((prev) => prev.filter((u) => u._id !== user._id))
      setNotice(`${user.name} has been approved.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not approve that account.')
    } finally {
      setActingOn(null)
    }
  }

  async function handleReject(user) {
    const reason = window.prompt(`Why are you rejecting ${user.name}?`)
    if (reason === null) return // cancelled

    setActingOn(user._id)
    setError('')
    setNotice('')
    try {
      await rejectAccount(user._id, reason)
      setPending((prev) => prev.filter((u) => u._id !== user._id))
      setNotice(`${user.name} has been rejected.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reject that account.')
    } finally {
      setActingOn(null)
    }
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (role) => <Badge variant={`role-${role}`}>{role}</Badge>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (phone) => phone || <span className="text-text-light">—</span>,
    },
    {
      key: 'createdAt',
      header: 'Requested',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      key: '_id',
      header: 'Actions',
      render: (_id, row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            icon={Check}
            loading={actingOn === _id}
            disabled={actingOn !== null}
            onClick={() => handleApprove(row)}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={X}
            disabled={actingOn !== null}
            onClick={() => handleReject(row)}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark mb-1">User Management</h1>
        <p className="text-sm text-text-muted">
          Hospital accounts require approval before they can sign in.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold text-text-dark">Pending approvals</h2>
          {!loading && pending.length > 0 && (
            <Badge variant="warning">{pending.length}</Badge>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : pending.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="Nothing waiting"
            description="There are no accounts awaiting approval right now."
          />
        ) : (
          <Table columns={columns} data={pending} rowKey="_id" />
        )}
      </div>
    </div>
  )
}

export default AdminUsers
