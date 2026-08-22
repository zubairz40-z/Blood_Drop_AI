import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Modal from '../ui/Modal'

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
  { value: 'NORMAL', label: 'NORMAL' },
  { value: 'URGENT', label: 'URGENT' },
  { value: 'CRITICAL', label: 'CRITICAL' },
]

function HospitalCreateRequestModal({ open, onClose, onCreateRequest }) {
  const [form, setForm] = useState({
    bloodGroup: '',
    donationType: '',
    units: '',
    emergencyLevel: '',
    note: '',
  })
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
    if (!form.bloodGroup) newErrors.bloodGroup = 'Required'
    if (!form.donationType) newErrors.donationType = 'Required'
    const units = Number(form.units)
    if (!form.units.trim()) {
      newErrors.units = 'Required'
    } else if (isNaN(units) || !Number.isInteger(units) || units < 1) {
      newErrors.units = 'Min 1'
    }
    if (!form.emergencyLevel) newErrors.emergencyLevel = 'Required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (onCreateRequest) {
      onCreateRequest({
        bloodGroup: form.bloodGroup,
        donationType: form.donationType,
        units: units,
        emergencyLevel: form.emergencyLevel,
        note: form.note.trim(),
      })
    }

    setForm({ bloodGroup: '', donationType: '', units: '', emergencyLevel: '', note: '' })
    setErrors({})
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Blood Request"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={Plus} onClick={handleSubmit}>
            Create Request
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
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
          placeholder="Select emergency level"
          error={errors.emergencyLevel}
          required
        />
        <Input
          label="Optional Note"
          name="note"
          value={form.note}
          onChange={handleChange}
          placeholder="Any additional notes..."
        />
      </div>
    </Modal>
  )
}

export default HospitalCreateRequestModal
