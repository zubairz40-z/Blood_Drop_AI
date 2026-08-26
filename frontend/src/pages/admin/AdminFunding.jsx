import { useState, useEffect } from 'react'
import api from '../../api/client'

function AdminFunding() {
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true)
        const { data } = await api.get('/api/payments/admin/all')
        if (data.success) {
          setPayments(data.payments || [])
          setStats(data.stats || [])
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  if (loading) return <div className="p-8 text-center text-text-muted">Loading funding data...</div>
  if (error) return <div className="p-8 text-center text-blood">Error: {error}</div>

  const statusMap = {}
  stats?.forEach(s => { statusMap[s._id] = { count: s.count, total: s.totalAmount } })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-text-charcoal">Funding Management</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-border">
          <p className="text-sm text-text-muted">Total Raised</p>
          <p className="text-2xl font-bold text-emerald-600">৳{(statusMap.COMPLETED?.total || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <p className="text-sm text-text-muted">Completed Transactions</p>
          <p className="text-2xl font-bold text-text-charcoal">{statusMap.COMPLETED?.count || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <p className="text-sm text-text-muted">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{statusMap.PENDING?.count || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-text-muted">Date</th>
              <th className="px-4 py-3 text-left text-text-muted">User</th>
              <th className="px-4 py-3 text-left text-text-muted">Amount</th>
              <th className="px-4 py-3 text-left text-text-muted">Status</th>
              <th className="px-4 py-3 text-left text-text-muted">Transaction</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-8 text-center text-text-muted">No transactions yet</td></tr>
            ) : payments.map(p => (
              <tr key={p._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">{p.user?.name || 'Unknown'}</td>
                <td className="px-4 py-3 font-medium">৳{p.amount?.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                    p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    p.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">{p.transactionId || p.paymentId || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminFunding
