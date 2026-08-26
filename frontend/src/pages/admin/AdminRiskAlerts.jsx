import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import RiskAdvisorPanel from '../../components/admin/RiskAdvisorPanel'
import { fetchAllRequests } from '../../api/adminApi'
import { coordinateBloodRequest } from '../../api/aiApi'

const RISK_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

function AdminRiskAlerts() {
  const [alerts, setAlerts] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingCoordination, setLoadingCoordination] = useState(false)
  const [error, setError] = useState(null)

  const loadRiskData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const requests = await fetchAllRequests()
      if (!requests || requests.length === 0) {
        setAlerts([])
        setSummary({ systemRisk: 'LOW', totalRequests: 0, criticalCount: 0, highCount: 0 })
        return
      }

      setLoadingCoordination(true)

      // Get AI coordination results for active requests (not terminal)
      const activeRequests = requests.filter(
        (r) => !['FULFILLED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(r.status)
      )

      // Run coordination for active requests to get real risk data
      // Limit to first 10 to avoid excessive calls
      const limited = activeRequests.slice(0, 10)
      const results = await Promise.allSettled(
        limited.map((r) => coordinateBloodRequest(r._id))
      )

      const riskAlerts = results
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r, idx) => {
          const coord = r.value
          const req = limited[idx]
          return {
            id: `risk-${req._id}`,
            level: coord.risk || 'LOW',
            riskScore: coord.riskScore || 0,
            title: `REQ-${String(req._id).slice(-6).toUpperCase()} — ${req.bloodGroup} ${req.component}`,
            description: coord.explanation || 'No risk explanation available.',
            recommendation: coord.recommendation || null,
            reasons: coord.riskReasons || [],
            bloodGroup: req.bloodGroup,
            component: req.component,
            urgency: req.urgency,
            status: req.status,
            hospital: req.hospital?.name || null,
            createdAt: req.createdAt,
            neededBy: req.neededBy,
            requestId: req._id,
          }
        })
        .sort((a, b) => (RISK_ORDER[a.level] ?? 4) - (RISK_ORDER[b.level] ?? 4))

      setAlerts(riskAlerts)

      // Build summary from real data
      const critCount = riskAlerts.filter((a) => a.level === 'CRITICAL').length
      const highCount = riskAlerts.filter((a) => a.level === 'HIGH').length
      const medCount = riskAlerts.filter((a) => a.level === 'MEDIUM').length
      const overallRisk = critCount > 0 ? 'CRITICAL' : highCount > 0 ? 'HIGH' : medCount > 0 ? 'MEDIUM' : 'LOW'

      setSummary({
        systemRisk: overallRisk,
        totalRequests: activeRequests.length,
        criticalCount: critCount,
        highCount: highCount,
      })
    } catch {
      setError('Unable to load risk data. Please try again.')
    } finally {
      setLoading(false)
      setLoadingCoordination(false)
    }
  }, [])

  useEffect(() => {
    loadRiskData()
  }, [loadRiskData])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Risk Alerts" description="Loading risk data..." />
        <div className="flex justify-center py-24">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        <PageHeader title="Risk Alerts" description="System risk monitoring." />
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load risk data"
          description={error}
          action={<Button onClick={loadRiskData} size="sm">Retry</Button>}
        />
      </motion.div>
    )
  }

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
            title="Risk Alerts"
            description="Real-time risk monitoring powered by the Risk & Advisor agent."
          />
          <Badge variant="role-admin">Admin</Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={loadRiskData}
          disabled={loadingCoordination}
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingCoordination ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loadingCoordination && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-soft/20 border border-brand-soft/50 text-sm text-brand">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Running AI coordination on active requests...
        </div>
      )}

      <p className="text-xs text-text-muted">
        Risk levels are computed by the backend Risk &amp; Advisor agent based on real request activity.
      </p>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-emerald-600">{summary.systemRisk}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-dark">System Risk</p>
              <p className="text-xs text-text-muted mt-0.5">Overall risk level</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-amber-600">{summary.criticalCount + summary.highCount}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-dark">Elevated Alerts</p>
              <p className="text-xs text-text-muted mt-0.5">CRITICAL + HIGH risk requests</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-blue-600">{summary.totalRequests}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-dark">Active Requests</p>
              <p className="text-xs text-text-muted mt-0.5">Requests being monitored</p>
            </div>
          </Card>
        </div>
      )}

      <RiskAdvisorPanel alerts={alerts} />
    </motion.div>
  )
}

export default AdminRiskAlerts
