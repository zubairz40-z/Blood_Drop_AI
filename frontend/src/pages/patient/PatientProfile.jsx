import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import PatientProfileSummary from '../../components/patient/PatientProfileSummary'
import PatientPersonalInfo from '../../components/patient/PatientPersonalInfo'
import PatientBasicProfile from '../../components/patient/PatientBasicProfile'
import PatientLocationForm from '../../components/patient/PatientLocationForm'
import PatientEmergencyContact from '../../components/patient/PatientEmergencyContact'
import PatientAccountSummary from '../../components/patient/PatientAccountSummary'
import { demoPatientProfile } from '../../data/demoPatientProfile'

function createInitialForm() {
  return {
    name: demoPatientProfile.name,
    email: demoPatientProfile.email,
    phone: demoPatientProfile.phone,
    bloodGroup: demoPatientProfile.bloodGroup,
    age: demoPatientProfile.age,
    location: { ...demoPatientProfile.location },
    emergencyContact: { ...demoPatientProfile.emergencyContact },
  }
}

function validate(form) {
  const errors = {}

  if (!form.name.trim()) errors.name = 'Name is required.'
  if (!form.phone.trim()) errors.phone = 'Phone number is required.'

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  const age = Number(form.age)
  if (!form.age.trim()) {
    errors.age = 'Age is required.'
  } else if (isNaN(age) || age <= 0 || !Number.isInteger(age)) {
    errors.age = 'Enter a valid positive age.'
  }

  if (!form.bloodGroup) errors.bloodGroup = 'Select a blood group.'

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
    form.email.trim(),
    form.phone.trim(),
    form.bloodGroup,
    form.age.trim(),
    form.location.mode === 'manual' ? form.location.address.trim() : form.location.latitude,
  ]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}

function PatientProfile() {
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
              title="Patient Profile"
              description="Keep your information accurate so BloodDrop can coordinate requests more effectively."
            />
          </div>
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
              activeRequests={demoPatientProfile.activeRequests}
              completedRequests={demoPatientProfile.completedRequests}
              completeness={completeness}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card title="Personal Information">
              <PatientPersonalInfo
                form={form}
                errors={errors}
                onChange={handleChange}
              />
            </Card>

            <Card title="Basic Profile">
              <PatientBasicProfile
                form={form}
                errors={errors}
                onChange={handleChange}
              />
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
                activeRequests={demoPatientProfile.activeRequests}
                completedRequests={demoPatientProfile.completedRequests}
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

export default PatientProfile
