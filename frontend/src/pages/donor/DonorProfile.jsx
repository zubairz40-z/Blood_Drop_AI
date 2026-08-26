import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import DonorProfileSummary from '../../components/donor/DonorProfileSummary'
import PersonalInformationForm from '../../components/donor/PersonalInformationForm'
import DonationPreferences from '../../components/donor/DonationPreferences'
import DonorLocationAvailability from '../../components/donor/DonorLocationAvailability'
import { useAuth } from '../../context/AuthContext'
import {
  fetchDonorProfile,
  createDonorProfile,
  updateDonorProfile,
  setDonorAvailability,
} from '../../api/donorApi'
import { updateCurrentUser } from '../../api/userApi'
import {
  donorProfileToApi,
  donorProfileFromApi,
  userFieldsToApi,
  eligibilityFromApi,
  calculateAge,
} from '../../api/mappers'

function emptyForm(user) {
  const u = user || {}
  return {
    name: u.name || '',
    phone: u.phone || '',
    dateOfBirth: '',
    age: null,
    weight: '',
    bloodGroup: u.bloodGroup || '',
    donationTypes: [],
    availability: true,
    location: { mode: 'manual', address: '', latitude: null, longitude: null },
  }
}

function validate(form) {
  const errors = {}

  if (!form.name.trim()) errors.name = 'Name is required.'
  if (!form.phone.trim()) errors.phone = 'Phone number is required.'

  if (!form.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required.'
  } else {
    const age = calculateAge(form.dateOfBirth)
    if (age < 18) errors.dateOfBirth = 'Donors must be at least 18 years old.'
    else if (age > 65) errors.dateOfBirth = 'Donors must be 65 or younger.'
  }

  const weight = Number(form.weight)
  if (!String(form.weight).trim()) {
    errors.weight = 'Weight is required.'
  } else if (isNaN(weight) || weight <= 0) {
    errors.weight = 'Enter a valid positive weight.'
  }

  if (!form.bloodGroup) errors.bloodGroup = 'Select a blood group.'
  if (form.donationTypes.length === 0) errors.donationTypes = 'Select at least one donation type.'

  if (form.location.mode === 'manual') {
    if (!form.location.address.trim()) errors.location = 'Enter your location.'
    else if (!Number.isFinite(Number(form.location.latitude)) || !Number.isFinite(Number(form.location.longitude))) {
      errors.location = 'Search for this address and choose a real location before saving.'
    } else if (Number(form.location.latitude) === 0 && Number(form.location.longitude) === 0) {
      errors.location = 'Choose a real location before saving.'
    }
  } else if (!form.location.latitude || !form.location.longitude) {
    errors.location = 'Use your current location before saving.'
  }

  return errors
}

function calculateCompleteness(form) {
  const fields = [
    form.name.trim(),
    form.phone.trim(),
    form.bloodGroup,
    form.dateOfBirth,
    String(form.weight).trim(),
    form.donationTypes.length > 0,
  ]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

function DonorProfile() {
  const navigate = useNavigate()
  const { profile: user, setProfile: setUser } = useAuth()

  const [form, setForm] = useState(() => emptyForm(user))
  const [savedForm, setSavedForm] = useState(() => emptyForm(user))
  const [eligibility, setEligibility] = useState([])
  const [hasProfile, setHasProfile] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [saveMessage, setSaveMessage] = useState(null)
  const [loadError, setLoadError] = useState(null)

    useEffect(() => {
    if (!user) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const donorProfile = await fetchDonorProfile()
        if (cancelled) return

        const mapped = donorProfileFromApi(donorProfile, user)
        setForm(mapped)
        setSavedForm(mapped)
        setEligibility(eligibilityFromApi(donorProfile))
        setHasProfile(true)
      } catch (err) {
        if (cancelled) return
        // 404 just means no profile yet — show a blank form
        if (err.response?.status === 404) {
          const blank = emptyForm(user)
          setForm(blank)
          setSavedForm(blank)
          setHasProfile(false)
        } else {
          setLoadError(err.response?.data?.message || 'Could not load your donor profile.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
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
      // Keep the displayed age in step with the date picker
      if (name === 'dateOfBirth') next.age = calculateAge(value)
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  function handleDonationTypesChange(types) {
    setForm((prev) => ({ ...prev, donationTypes: types }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.donationTypes
      return next
    })
  }

  function handleLocationChange(location) {
    setForm((prev) => ({ ...prev, location }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.location
      return next
    })
  }

  // Availability saves immediately — it's a single toggle, not part of the form
  async function handleAvailabilityChange(available) {
    const previous = form.availability
    setForm((prev) => ({ ...prev, availability: available }))

    if (!hasProfile) return // nothing to save against yet

    try {
      await setDonorAvailability(available)
      setSavedForm((prev) => ({ ...prev, availability: available }))
    } catch (err) {
      setForm((prev) => ({ ...prev, availability: previous }))
      setSaveMessage(null)
      setLoadError(err.response?.data?.message || 'Could not update availability.')
    }
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
      // Name and phone live on the User document, everything else on DonorProfile
      const updatedUser = await updateCurrentUser(userFieldsToApi(form))
      setUser(updatedUser)

      const payload = donorProfileToApi(form)
      const saved = hasProfile
        ? await updateDonorProfile(payload)
        : await createDonorProfile(payload)

      const mapped = donorProfileFromApi(saved, updatedUser)
      setForm(mapped)
      setSavedForm(mapped)
      setEligibility(eligibilityFromApi(saved))
      setHasProfile(true)
      setSaveMessage('Your donor profile has been saved.')
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
        <div>
          <div className="flex items-center gap-2">
            <PageHeader
              title="Donor Profile"
              description="Keep your donor information accurate so BloodDrop can coordinate requests more effectively."
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="role-donor">Donor</Badge>
          <button
            onClick={() => navigate('/donor')}
            className="text-sm text-text-muted hover:text-text-dark transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {!hasProfile && (
        <Alert variant="info">
          You haven&apos;t set up your donor profile yet. Fill in the details below to start receiving requests.
        </Alert>
      )}

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
          <div className="lg:col-span-1 space-y-6">
            <DonorProfileSummary
              name={form.name || 'Donor'}
              bloodGroup={form.bloodGroup || '—'}
              availability={form.availability}
              completeness={completeness}
            />

            {eligibility.length > 0 && (
              <Card title="Eligibility">
                <div className="space-y-3">
                  {eligibility.map((item) => (
                    <div key={item.component} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-dark">{item.label}</p>
                        {!item.isEligible && item.nextEligibleAt && (
                          <p className="text-xs text-text-muted">
                            Eligible from {item.nextEligibleAt.toLocaleDateString()}
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
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card title="Personal Information">
              <PersonalInformationForm
                form={form}
                errors={errors}
                onChange={handleChange}
              />
            </Card>

            <Card
              title="Donation Preferences"
              subtitle="Select the donation types you are willing to be contacted for."
            >
              <DonationPreferences
                selectedTypes={form.donationTypes}
                onChange={handleDonationTypesChange}
                error={errors.donationTypes}
              />
            </Card>

            <Card title="Location & Availability">
              <DonorLocationAvailability
                location={form.location}
                onLocationChange={handleLocationChange}
                available={form.availability}
                onAvailabilityChange={handleAvailabilityChange}
                error={errors.location}
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
                {hasProfile ? 'Save Changes' : 'Create Profile'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  )
}

export default DonorProfile