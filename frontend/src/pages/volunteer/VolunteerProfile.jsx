import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Avatar from '../../components/ui/Avatar'
import Input from '../../components/ui/Input'
import { demoVolunteerProfile } from '../../data/demoVolunteerPages'

function createInitialForm() {
  return {
    name: demoVolunteerProfile.name,
    email: demoVolunteerProfile.email,
    phone: demoVolunteerProfile.phone,
    location: demoVolunteerProfile.location,
  }
}

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Name is required.'
  if (!form.email.trim()) errors.email = 'Email is required.'
  if (!form.phone.trim()) errors.phone = 'Phone number is required.'
  return errors
}

function VolunteerProfile() {
  const navigate = useNavigate()
  const [form, setForm] = useState(createInitialForm)
  const [savedForm, setSavedForm] = useState(createInitialForm)
  const [errors, setErrors] = useState({})
  const [saveMessage, setSaveMessage] = useState(null)

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  )

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

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
        <div className="flex items-center gap-2">
          <PageHeader
            title="Volunteer Profile"
            description="Keep your contact information up to date for coordination."
          />
          <Badge variant="role-volunteer">Volunteer</Badge>
        </div>
        <button
          onClick={() => navigate('/volunteer')}
          className="text-sm text-text-muted hover:text-text-dark transition-colors cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>

      {saveMessage && (
        <Alert variant="success" onDismiss={() => setSaveMessage(null)}>
          {saveMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <div className="flex flex-col items-center text-center">
                <Avatar name={form.name} size="xl" />
                <h3 className="text-lg font-semibold text-text-dark mt-4">{form.name}</h3>
                <p className="text-sm text-text-muted mt-0.5">Volunteer profile</p>
                <div className="mt-3">
                  <Badge variant={demoVolunteerProfile.availability ? 'success' : 'warning'}>
                    {demoVolunteerProfile.availability ? 'Available' : 'Busy'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card title="Personal Information">
              <div className="space-y-4">
                <Input
                  label="Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  error={errors.name}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@email.com"
                    required
                    error={errors.email}
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+880 1XXXXXXXXX"
                    required
                    error={errors.phone}
                  />
                </div>
                <Input
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Dhanmondi, Dhaka"
                />
              </div>
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

export default VolunteerProfile
