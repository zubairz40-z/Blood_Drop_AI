import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import PatientProfileSummary from '../../components/patient/PatientProfileSummary'
import PatientPersonalInfo from '../../components/patient/PatientPersonalInfo'
import PatientBasicProfile from '../../components/patient/PatientBasicProfile'
import PatientLocationForm from '../../components/patient/PatientLocationForm'
import PatientEmergencyContact from '../../components/patient/PatientEmergencyContact'
import PatientAccountSummary from '../../components/patient/PatientAccountSummary'
import { useAuth } from '../../context/AuthContext'
import { updateCurrentUser } from '../../api/userApi'
import { fetchMyRequests } from '../../api/requestApi'
import { userProfileFromApi, userProfileToApi, calculateAge } from '../../api/mappers'

const TERMINAL_STATUSES = ['FULFILLED', 'CANCELLED', 'REJECTED', 'EXPIRED']

function validate(form) {
  const errors = {}

  if (!form.name.trim()) errors.name = 'Name is required.'
  if (!form.phone.trim()) errors.phone = 'Phone number is required.'

  if (form.dateOfBirth) {
    const age = calculateAge(form.dateOfBirth)
    if (age < 0 || age > 120) errors.dateOfBirth = 'Enter a valid date of birth.'
  }

  return errors
}

function calculateCompleteness(form) {
  const fields = [
    form.name.trim(),
    form.phone.trim(),
    form.bloodGroup,
    form.dateOfBirth,
    form.location.address?.trim() || form.location.latitude,
    form.emergencyContact.name?.trim(),
  ]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

function PatientProfile() {
  const navigate = useNavigate()
  const { profile: user, setProfile: setUser } = useAuth()

  const [form, setForm] = useState(() => userProfileFromApi(user))
  const [savedForm, setSavedForm] = useState(() => userProfileFromApi(user))
  const [counts, setCounts] = useState({ active: 0, completed: 0 })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [saveMessage, setSaveMessage] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (!user) return

    const mapped = userProfileFromApi(user)
    setForm(mapped)
    setSavedForm(mapped)

    let cancelled = false

    async function loadCounts() {
      try {
        const requests = await fetchMyRequests()
        if (cancelled) return
        setCounts({
          active: requests.filter((r) => !TERMINAL_STATUSES.includes(r.status)).length,
          completed: requests.filter((r) => r.status === 'FULFILLED').length,
        })
      } catch {
        // Counts are supplementary — a failure here shouldn't block the page
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCounts()
    return () => { cancelled = true }
  }, [user])

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  )

  const completeness = useMemo(() => calculateCompleteness(form), [form])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'dateOfBirth') next.age = calculateAge(value)
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  function handleLocationChange(location) {
    setForm((prev) => ({ ...prev, location }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.location
      return next
    })
  }

  function handleEmergencyContactChange(emergencyContact) {
    setForm((prev) => ({ ...prev, emergencyContact }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setSaving(true)
    setSaveMessage(null)
    setLoadError(null)

    try {
      const updated = await updateCurrentUser(userProfileToApi(form))
      setUser(updated)
      const mapped = userProfileFromApi(updated)
      setForm(mapped)
      setSavedForm(mapped)
      setSaveMessage('Your profile has been saved.')
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setForm({ ...savedForm })
    setErrors({})
    setSaveMessage(null)
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
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <PageHeader
            title="Patient Profile"
            description="Keep your information accurate so BloodDrop can coordinate requests more effectively."
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="role-patient">Patient</Badge>
          <button
            onClick={() => navigate('/patient')}
            className="text-sm text-text-muted hover:text-text-dark transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {loadError && (
        <Alert variant="error" onDismiss={() => setLoadError(null)}>
          {loadError}
        </Alert>
      )}

      {saveMessage && (
        <Alert variant="success" onDismiss={() => setSaveMessage(null)}>
          {saveMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <PatientProfileSummary
              name={form.name || 'Patient'}
              bloodGroup={form.bloodGroup || '—'}
              activeRequests={counts.active}
              completedRequests={counts.completed}
              completeness={completeness}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card title="Personal Information">
              <PatientPersonalInfo form={form} errors={errors} onChange={handleChange} />
            </Card>

            <Card title="Basic Profile">
              <PatientBasicProfile form={form} errors={errors} onChange={handleChange} />
            </Card>

            <Card title="Location">
              <PatientLocationForm
                location={form.location}
                onLocationChange={handleLocationChange}
                error={errors.location}
              />
            </Card>

            <Card
              title="Emergency / Contact Information"
              subtitle="Optional emergency contact for coordination purposes."
            >
              <PatientEmergencyContact
                contact={form.emergencyContact}
                errors={errors}
                onChange={handleEmergencyContactChange}
              />
            </Card>

            <Card title="Account Summary">
              <PatientAccountSummary
                activeRequests={counts.active}
                completedRequests={counts.completed}
              />
            </Card>

            <div className="flex items-center justify-end gap-3 pt-2 pb-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={!hasChanges || saving}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving} disabled={!hasChanges}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  )
}

export default PatientProfile