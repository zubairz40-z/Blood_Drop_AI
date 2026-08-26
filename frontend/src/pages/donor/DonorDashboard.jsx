import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import DonorStatusGrid from '../../components/donor/DonorStatusGrid'
import DonorQuickActions from '../../components/donor/DonorQuickActions'
import { useAuth } from '../../context/AuthContext'
import { fetchDonorProfile, setDonorAvailability } from '../../api/donorApi'
import { donorProfileFromApi, eligibilityFromApi } from '../../api/mappers'

function DonorDashboard() {
  const navigate = useNavigate()
  const { profile: user } = useAuth()

  const [donor, setDonor] = useState(null)
  const [eligibility, setEligibility] = useState([])
  const [available, setAvailable] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function load() {
      try {
        const profile = await fetchDonorProfile()
        if (cancelled) return

        setDonor({
          bloodGroup: profile.bloodGroup,
          totalDonations: profile.totalDonations || 0,
        })
        setEligibility(eligibilityFromApi(profile))
        setAvailable(profile.isAvailable ?? true)
        setHasProfile(true)
      } catch (err) {
        if (cancelled) return
        if (err.response?.status === 404) {
          setHasProfile(false)
        } else {
          setError(err.message || 'Could not load your donor profile.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user])

  async function handleToggleAvailability() {
    const previous = available
    const next = !available
    setAvailable(next)

    try {
      await setDonorAvailability(next)
    } catch (err) {
      setAvailable(previous)
      setError(err.message || 'Could not update your availability.')
    }
  }

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
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text-dark">
              Welcome back, {user?.name || 'Donor'}
            </h1>
            {hasProfile && <Badge variant="role-donor">Active Donor</Badge>}
          </div>
          <p className="text-sm text-text-muted mt-1">
            Stay ready to donate and respond when someone nearby needs your help.
          </p>
        </div>
      </div>

      {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}

      {!hasProfile ? (
        <Card>
          <EmptyState
            icon={UserPlus}
            title="Set up your donor profile"
            description="Add your blood group, donation preferences, and location so BloodDrop can match you with people who need help."
            action={
              <Button onClick={() => navigate('/donor/profile')}>Create Donor Profile</Button>
            }
          />
        </Card>
      ) : (
        <>
          <DonorStatusGrid
            donor={donor}
            eligibility={eligibility}
            available={available}
            onToggleAvailability={handleToggleAvailability}
          />

          <div>
            <h2 className="text-lg font-semibold text-text-dark mb-3">Quick Actions</h2>
            <DonorQuickActions
              available={available}
              onToggleAvailability={handleToggleAvailability}
            />
          </div>

          <Card title="Eligibility by donation type">
            <div className="space-y-3">
              {eligibility.map((item) => (
                <div
                  key={item.component}
                  className="flex items-center justify-between p-3 bg-surface-soft rounded-xl border border-border"
                >
                  <div>
                    <p className="text-sm font-medium text-text-dark">{item.label}</p>
                    {!item.isEligible && item.nextEligibleAt && (
                      <p className="text-xs text-text-muted mt-0.5">
                        Eligible again from {item.nextEligibleAt.toLocaleDateString()}
                      </p>
                    )}
                    {item.lastDonationAt && (
                      <p className="text-xs text-text-muted mt-0.5">
                        Last donated {item.lastDonationAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge variant={item.isEligible ? 'success' : 'warning'}>
                    {item.isEligible ? 'Eligible' : 'Deferred'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </motion.div>
  )
}

export default DonorDashboard