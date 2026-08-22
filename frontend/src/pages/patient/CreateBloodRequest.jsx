import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import BloodRequirementForm from '../../components/patient/BloodRequirementForm'
import RequestLocationForm from '../../components/patient/RequestLocationForm'
import EmergencyLevelSelector from '../../components/patient/EmergencyLevelSelector'
import RequestCreatedState from '../../components/patient/RequestCreatedState'

const initialForm = {
  bloodGroup: '',
  donationType: '',
  units: '',
  hospital: '',
  emergencyLevel: '',
  location: {
    mode: 'manual',
    address: '',
    latitude: null,
    longitude: null,
  },
}

function validate(form) {
  const errors = {}
  if (!form.bloodGroup) errors.bloodGroup = 'Select a blood group.'
  if (!form.donationType) errors.donationType = 'Select a donation type.'

  const units = Number(form.units)
  if (!form.units.trim()) {
    errors.units = 'Enter the number of units required.'
  } else if (isNaN(units) || !Number.isInteger(units) || units < 1) {
    errors.units = 'Enter a valid positive number (minimum 1).'
  }

  if (!form.hospital) errors.hospital = 'Select a hospital.'
  if (!form.emergencyLevel) errors.emergencyLevel = 'Select an emergency level.'

  if (form.location.mode === 'manual') {
    if (!form.location.address.trim()) errors.location = 'Enter the request location.'
  } else {
    if (!form.location.latitude || !form.location.longitude) errors.location = 'Capture your current location first.'
  }

  return errors
}

function CreateBloodRequest() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [createdRequest, setCreatedRequest] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[name]
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

  function handleEmergencyLevelChange(level) {
    setForm((prev) => ({ ...prev, emergencyLevel: level }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.emergencyLevel
      return next
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setCreatedRequest({
      id: 'REQ-DEMO-2002',
      bloodGroup: form.bloodGroup,
      donationType: form.donationType,
      units: Number(form.units),
      hospital: form.hospital,
      emergencyLevel: form.emergencyLevel,
      location: form.location.mode === 'current'
        ? `${form.location.latitude}, ${form.location.longitude}`
        : form.location.address,
    })
  }

  if (createdRequest) {
    return <RequestCreatedState request={createdRequest} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-3xl"
    >
      <PageHeader
        title="Create Blood Request"
        description="Provide the blood requirement and emergency details so BloodDrop can begin coordination."
        onBack={() => navigate('/patient')}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Blood Requirement">
          <BloodRequirementForm
            form={form}
            errors={errors}
            onChange={handleChange}
          />
        </Card>

        <Card title="Hospital & Location">
          <RequestLocationForm
            form={form}
            errors={errors}
            onChange={handleChange}
            onLocationChange={handleLocationChange}
          />
        </Card>

        <Card>
          <EmergencyLevelSelector
            value={form.emergencyLevel}
            onChange={handleEmergencyLevelChange}
            error={errors.emergencyLevel}
          />
        </Card>

        <div className="flex justify-end pb-4">
          <Button type="submit" icon={Search}>
            Find Donor
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

export default CreateBloodRequest
