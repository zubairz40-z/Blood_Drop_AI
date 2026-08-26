import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fetchMyRequests } from '../../api/requestApi'
import { bloodRequestFromApi } from '../../api/mappers'

const TERMINAL_STATUSES = ['FULFILLED', 'CANCELLED', 'REJECTED', 'EXPIRED']

function PatientRequests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const list = await fetchMyRequests()
        if (!cancelled) setRequests(list.map(bloodRequestFromApi))
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load your requests.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const active = requests.filter((r) => !TERMINAL_STATUSES.includes(r.status))
  const past = requests.filter((r) => TERMINAL_STATUSES.includes(r.status))

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl"
    >
      <PageHeader
        title="My Requests"
        description="View and track all your blood requests."
        onBack={() => navigate('/patient')}
      />

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card title="Active Requests">
        {active.length === 0 ? (
          <EmptyState
            title="No active requests"
            description="You currently have no active blood requests."
            action={
              <Button onClick={() => navigate('/patient/requests/create')}>
                Create Blood Request
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {active.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-soft rounded-xl border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blood-soft flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blood">{req.bloodGroup}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text-dark">{req.shortId}</p>
                      <Badge variant={req.statusVariant}>{req.statusLabel}</Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {req.componentLabel} · {req.unitsRequired}{' '}
                      {req.unitsRequired === 1 ? 'unit' : 'units'} · {req.urgencyLabel}
                    </p>
                    {req.hospital?.name && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-text-muted flex-shrink-0" />
                        <p className="text-xs text-text-muted truncate">{req.hospital.name}</p>
                      </div>
                    )}
                    {req.neededBy && (
                      <p className="text-xs text-text-muted mt-0.5">
                        Needed by {req.neededBy.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/patient/requests/${req.id}/tracking`)}
                  >
                    Track Request
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Past Requests">
        {past.length === 0 ? (
          <EmptyState
            title="No past requests"
            description="Completed and cancelled requests will appear here."
          />
        ) : (
          <div className="space-y-3">
            {past.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 p-3 bg-surface-soft rounded-xl border border-border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-text-secondary">{req.bloodGroup}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-dark">{req.componentLabel}</p>
                    <p className="text-xs text-text-muted truncate">
                      {req.unitsRequired} {req.unitsRequired === 1 ? 'unit' : 'units'} · {req.shortId}
                      {req.createdAt && ` · ${req.createdAt.toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <Badge variant={req.statusVariant}>{req.statusLabel}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default PatientRequests