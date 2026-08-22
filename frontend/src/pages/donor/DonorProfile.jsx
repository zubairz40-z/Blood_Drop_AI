import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import DonorProfileSummary from '../../components/donor/DonorProfileSummary'
import PersonalInformationForm from '../../components/donor/PersonalInformationForm'
import DonationPreferences from '../../components/donor/DonationPreferences'
import DonorLocationAvailability from '../../components/donor/DonorLocationAvailability'
import { demoDonor } from '../../data/demoDonorData'

function createInitialForm() {
  return {
    name: demoDonor.name,
    phone: demoDonor.phone,
    age: demoDonor.age.toString(),
    weight: demoDonor.weight.toString(),
    bloodGroup: demoDonor.bloodGroup,
    donationTypes: [...demoDonor.donationTypes],
    availability: demoDonor.availability,
    location: { ...demoDonor.location },
  }
}

function validate(form) {
  const errors = {}

  if (!form.name.trim()) errors.name = 'Name is required.'
  if (!form.phone.trim()) errors.phone = 'Phone number is required.'

  const age = Number(form.age)
  if (!form.age.trim()) {
    errors.age = 'Age is required.'
  } else if (isNaN(age) || age <= 0 || !Number.isInteger(age)) {
    errors.age = 'Enter a valid positive age.'
  }

  const weight = Number(form.weight)
  if (!form.weight.trim()) {
    errors.weight = 'Weight is required.'
  } else if (isNaN(weight) || weight <= 0) {
    errors.weight = 'Enter a valid positive weight.'
  }

  if (!form.bloodGroup) errors.bloodGroup = 'Select a blood group.'
  if (form.donationTypes.length === 0) errors.donationTypes = 'Select at least one donation type.'

  if (form.location.mode === 'manual') {
    if (!form.location.address.trim()) errors.location = 'Enter your location.'
  } else {
    if (!form.location.latitude || !form.location.longitude) errors.location = 'Use your current location before saving.'
  }

  return errors
}

function calculateCompleteness(form) {
  const fields = [
    form.name.trim(),
    form.phone.trim(),
    form.bloodGroup,
    form.age.trim(),
    form.weight.trim(),
    form.donationTypes.length > 0,
  ]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}

function DonorProfile() {
  const navigate = useNavigate()
  const [form, setForm] = useState(createInitialForm)
  const [savedForm, setSavedForm] = useState(createInitialForm)
  const [errors, setErrors] = useState({})
  const [saveMessage, setSaveMessage] = useState(null)

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  )

  const completeness = useMemo(() => calculateCompleteness(form), [form])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
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

  function handleAvailabilityChange(available) {
    setForm((prev) => ({ ...prev, availability: available }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setSavedForm({ ...form })
    setSaveMessage('Profile changes are ready. Permanent saving will be connected with the backend later.')
  }

  function handleCancel() {
    setForm({ ...savedForm })
    setErrors({})
    setSaveMessage(null)
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

      {saveMessage && (
        <Alert variant="success" onDismiss={() => setSaveMessage(null)}>
          {saveMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <DonorProfileSummary
              name={form.name || 'Donor'}
              bloodGroup={form.bloodGroup || '—'}
              availability={form.availability}
              completeness={completeness}
            />
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
                disabled={!hasChanges}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!hasChanges}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  )
}

export default DonorProfile
