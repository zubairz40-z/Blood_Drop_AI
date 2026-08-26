import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Avatar from '../../components/ui/Avatar'
import Input from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fetchCurrentUser } from '../../api/authApi'
import { updateCurrentUser } from '../../api/userApi'

function createEmptyForm() {
  return { name: '', email: '', phone: '', location: '' }
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [form, setForm] = useState(createEmptyForm)
  const [savedForm, setSavedForm] = useState(createEmptyForm)
  const [errors, setErrors] = useState({})
  const [saveMessage, setSaveMessage] = useState(null)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        const user = await fetchCurrentUser()
        const formValues = {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          location: user.location || '',
        }
        setForm(formValues)
        setSavedForm(formValues)
      } catch (err) {
        setLoadError(err.response?.data?.message || 'Failed to load profile.')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

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

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setSaveError(null)
    try {
      setSaving(true)
      const updated = await updateCurrentUser({
        name: form.name,
        phone: form.phone,
        location: form.location,
      })
      const updatedForm = {
        name: updated.name || form.name,
        email: updated.email || form.email,
        phone: updated.phone || form.phone,
        location: updated.location || form.location,
      }
      setForm(updatedForm)
      setSavedForm(updatedForm)
      setSaveMessage('Profile updated successfully.')
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setForm({ ...savedForm })
    setErrors({})
    setSaveMessage(null)
    setSaveError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner label="Loading profile..." />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Volunteer Profile"
          description="Keep your contact information up to date for coordination."
        />
        <Alert variant="error">{loadError}</Alert>
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

      {saveError && (
        <Alert variant="error" onDismiss={() => setSaveError(null)}>
          {saveError}
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
                disabled={!hasChanges || saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!hasChanges} loading={saving}>
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
