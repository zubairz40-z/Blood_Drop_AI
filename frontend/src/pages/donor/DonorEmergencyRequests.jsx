import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Siren } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmergencyRequestCard from '../../components/donor/EmergencyRequestCard'
import { fetchNotifications } from '../../api/notificationApi'
import { respondToMatch } from '../../api/matchApi'

function DonorEmergencyRequests() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [respondingId, setRespondingId] = useState(null)
  const [respondedMap, setRespondedMap] = useState({})
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const result = await fetchNotifications()
      const matchNotifications = result.notifications.filter(
        (n) => n.type === 'MATCH_FOUND'
      )
      setNotifications(matchNotifications)
    } catch {
      // Leave state as-is on error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    load().then(() => { if (cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [load])

  const pendingCount = useMemo(
    () => notifications.filter((n) => !n.read && !respondedMap[n.id]).length,
    [notifications, respondedMap]
  )

  async function handleAccept(requestId) {
    const notification = notifications.find((n) => n.requestId === requestId)
    if (!notification) return

    setRespondingId(requestId)
    setError(null)
    try {
      await respondToMatch(requestId, 'ACCEPT')
      setRespondedMap((prev) => ({ ...prev, [notification.id]: 'ACCEPT' }))
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message
      if (status === 409) {
        setError('This match offer has expired. The system has moved on to the next donor.')
        setRespondedMap((prev) => ({ ...prev, [notification.id]: 'EXPIRED' }))
      } else if (status === 400) {
        setError(msg || 'Invalid response. Please try again.')
      } else if (status === 403) {
        setError('You are not authorized to respond to this request.')
      } else if (status === 404) {
        setError('This request was not found.')
      } else {
        setError(msg || 'Unable to process your response. Please try again.')
      }
    } finally {
      setRespondingId(null)
    }
  }

  async function handleDecline(requestId) {
    const notification = notifications.find((n) => n.requestId === requestId)
    if (!notification) return

    setRespondingId(requestId)
    setError(null)
    try {
      await respondToMatch(requestId, 'DECLINE')
      setRespondedMap((prev) => ({ ...prev, [notification.id]: 'DECLINE' }))
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message
      if (status === 409) {
        setError('This match offer has expired.')
        setRespondedMap((prev) => ({ ...prev, [notification.id]: 'EXPIRED' }))
      } else {
        setError(msg || 'Unable to process your response. Please try again.')
      }
    } finally {
      setRespondingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Emergency Requests" description="Loading..." />
        <div className="flex justify-center py-24">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Emergency Requests"
          description="Review compatible blood requests near you and respond based on your availability."
        />
        {pendingCount > 0 && (
          <Badge variant="warning">Pending: {pendingCount}</Badge>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          {error}
        </div>
      )}

      <Card>
        {notifications.length === 0 ? (
          <EmptyState
            icon={Siren}
            title="No emergency requests right now"
            description="Compatible requests will appear here when they become available."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const responded = respondedMap[n.id]
              return (
                <EmergencyRequestCard
                  key={n.id}
                  request={{
                    id: n.requestId,
                    bloodGroup: n.bloodGroup || '—',
                    component: n.component || '—',
                    units: 1,
                    hospitalName: '—',
                    urgency: n.urgency || 'EMERGENCY',
                    wave: n.wave,
                    expiresAt: n.expiresAt,
                    distanceKm: null,
                    etaMinutes: null,
                    responded: responded || null,
                  }}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  responding={respondingId === n.requestId}
                />
              )
            })}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default DonorEmergencyRequests
