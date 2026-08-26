import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Modal from '../ui/Modal'
import Alert from '../ui/Alert'

const bloodGroupOptions = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
]

const donationTypeOptions = [
  { value: 'Whole Blood', label: 'Whole Blood' },
  { value: 'Plasma', label: 'Plasma' },
  { value: 'Platelets', label: 'Platelets' },
  { value: 'Double Red Cells', label: 'Double Red Cells' },
]

const emergencyLevelOptions = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'CRITICAL', label: 'Critical' },
]

const emptyForm = {
  patientName: '',
  patientPhone: '',
  bloodGroup: '',
  donationType: '',
  units: '',
  neededBy: '',
  emergencyLevel: '',
  note: '',
}

function HospitalCreateRequestModal({ open, onClose, onCreateRequest, submitting, error }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  function handleSubmit() {
    const newErrors = {}

    if (!form.patientName.trim()) {
      newErrors.patientName = 'Enter a name, or a description if unidentified'
    }
    if (!form.bloodGroup) newErrors.bloodGroup = 'Required'
    if (!form.donationType) newErrors.donationType = 'Required'

    const units = Number(form.units)
    if (!String(form.units).trim()) {
      newErrors.units = 'Required'
    } else if (isNaN(units) || !Number.isInteger(units) || units < 1) {
      newErrors.units = 'Min 1'
    }

    if (!form.neededBy) {
      newErrors.neededBy = 'Required'
    } else if (new Date(form.neededBy) <= new Date()) {
      newErrors.neededBy = 'Must be in the future'
    }

    if (!form.emergencyLevel) newErrors.emergencyLevel = 'Required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onCreateRequest({ ...form, units })
  }

  function handleClose() {
    setForm(emptyForm)
    setErrors({})
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="File Emergency Blood Request"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button icon={Plus} onClick={handleSubmit} loading={submitting}>
            File Request
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Alert variant="info">
          This request is filed under your hospital&apos;s account and goes out
          without further verification. It will be recorded against your account.
        </Alert>

        <Input
          label="Patient Name"
          name="patientName"
          value={form.patientName}
          onChange={handleChange}
          placeholder="Full name, or e.g. 'Unidentified male, approx. 30'"
          error={errors.patientName}
          required
        />

        <Input
          label="Patient Phone"
          name="patientPhone"
          type="tel"
          value={form.patientPhone}
          onChange={handleChange}
          placeholder="+880 1XXXXXXXXX"
          helperText="Optional. If they have a BloodDrop account, this links the request to it."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Blood Group"
            name="bloodGroup"
            value={form.bloodGroup}
            onChange={handleChange}
            options={bloodGroupOptions}
            placeholder="Select blood group"
            error={errors.bloodGroup}
            required
          />
          <Select
            label="Donation Type"
            name="donationType"
            value={form.donationType}
            onChange={handleChange}
            options={donationTypeOptions}
            placeholder="Select donation type"
            error={errors.donationType}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Units Required"
            name="units"
            type="number"
            value={form.units}
            onChange={handleChange}
            placeholder="Minimum 1"
            error={errors.units}
            min="1"
            required
          />
          <Select
            label="Emergency Level"
            name="emergencyLevel"
            value={form.emergencyLevel}
            onChange={handleChange}
            options={emergencyLevelOptions}
            placeholder="Select level"
            error={errors.emergencyLevel}
            required
          />
        </div>

        <Input
          label="Needed By"
          name="neededBy"
          type="datetime-local"
          value={form.neededBy}
          onChange={handleChange}
          error={errors.neededBy}
          required
        />

        <Input
          label="Clinical Note"
          name="note"
          value={form.note}
          onChange={handleChange}
          placeholder="e.g. Road traffic accident, brought in by passer-by"
        />
      </div>
    </Modal>
  )
}

export default HospitalCreateRequestModal