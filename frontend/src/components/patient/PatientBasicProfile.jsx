import Input from '../ui/Input'
import Select from '../ui/Select'
import { bloodGroupOptions } from '../../data/demoPatientProfile'

function PatientBasicProfile({ form, errors, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Blood Group"
          name="bloodGroup"
          value={form.bloodGroup}
          onChange={onChange}
          options={bloodGroupOptions}
          placeholder="Select blood group"
          required
          error={errors.bloodGroup}
        />

        <Input
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          value={form.dateOfBirth}
          onChange={onChange}
          error={errors.dateOfBirth}
          helperText={form.age != null && form.age >= 0 ? `Age: ${form.age}` : undefined}
        />
      </div>
    </div>
  )
}

export default PatientBasicProfile
