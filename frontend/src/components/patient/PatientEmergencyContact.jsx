import Input from '../ui/Input'
import Select from '../ui/Select'
import { relationshipOptions } from '../../data/demoPatientProfile'

function PatientEmergencyContact({ contact, errors, onChange }) {
  function handleChange(e) {
    const { name, value } = e.target
    onChange({ ...contact, [name]: value })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Contact Name"
        name="name"
        value={contact.name}
        onChange={handleChange}
        placeholder="Emergency contact full name"
        error={errors.emergencyName}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Contact Phone"
          name="phone"
          type="tel"
          value={contact.phone}
          onChange={handleChange}
          placeholder="+880 1XXXXXXXXX"
          error={errors.emergencyPhone}
        />

        <Select
          label="Relationship"
          name="relationship"
          value={contact.relationship}
          onChange={handleChange}
          options={relationshipOptions}
          placeholder="Select relationship"
        />
      </div>

      <p className="text-xs text-text-muted">
        This information is optional. It will be used to reach someone in case of an emergency during blood coordination.
      </p>
    </div>
  )
}

export default PatientEmergencyContact
