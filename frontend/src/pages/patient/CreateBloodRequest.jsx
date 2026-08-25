import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import BloodRequirementForm from '../../components/patient/BloodRequirementForm'
import RequestLocationForm from '../../components/patient/RequestLocationForm'
import EmergencyLevelSelector from '../../components/patient/EmergencyLevelSelector'
import RequestCreatedState from '../../components/patient/RequestCreatedState'
import { fetchHospitals } from '../../api/hospitalApi'
import { createBloodRequest } from '../../api/requestApi'
import { bloodRequestToApi, bloodRequestFromApi } from '../../api/mappers'

const initialForm = {
  bloodGroup: '',
  donationType: '',
  units: '',
  neededBy: '',
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
  if (!String(form.units).trim()) {
    errors.units = 'Enter the number of units required.'
  } else if (isNaN(units) || !Number.isInteger(units) || units < 1) {
    errors.units = 'Enter a valid positive number (minimum 1).'
  }

  if (!form.neededBy) {
    errors.neededBy = 'Select when the blood is needed.'
  } else if (new Date(form.neededBy) <= new Date()) {
    errors.neededBy = 'The needed-by time must be in the future.'
  }

  if (!form.hospital) errors.hospital = 'Select a hospital.'
  if (!form.emergencyLevel) errors.emergencyLevel = 'Select an emergency level.'

  return errors
}

function CreateBloodRequest() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [createdRequest, setCreatedRequest] = useState(null)

  const [hospitals, setHospitals] = useState([])
  const [hospitalsLoading, setHospitalsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const list = await fetchHospitals()
        if (!cancelled) setHospitals(list)
      } catch (err) {
        if (!cancelled) {
          setSubmitError(err.response?.data?.message || 'Could not load hospitals.')
        }
      } finally {
        if (!cancelled) setHospitalsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

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

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setSubmitting(true)
    setSubmitError(null)

    try {
      const saved = await createBloodRequest(bloodRequestToApi(form))
      setCreatedRequest(bloodRequestFromApi(saved))
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Could not create your request.')
    } finally {
      setSubmitting(false)
    }
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

      {submitError && (
        <Alert variant="error" onDismiss={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

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
            hospitals={hospitals}
            hospitalsLoading={hospitalsLoading}
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
          <Button type="submit" icon={Search} loading={submitting}>
            Find Donor
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

export default CreateBloodRequest