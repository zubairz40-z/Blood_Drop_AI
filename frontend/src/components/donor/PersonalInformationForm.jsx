import Input from '../ui/Input'
import Select from '../ui/Select'
import { bloodGroupOptions } from '../../data/demoDonorData'

function PersonalInformationForm({ form, errors, onChange }) {
  return (
    <div className="space-y-4">
      <Input
        label="Name"
        name="name"
        value={form.name}
        onChange={onChange}
        placeholder="Enter your full name"
        required
        error={errors.name}
      />

      <Input
        label="Phone"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={onChange}
        placeholder="+880 1XXXXXXXXX"
        required
        error={errors.phone}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Age"
          name="age"
          type="number"
          value={form.age}
          onChange={onChange}
          placeholder="25"
          required
          error={errors.age}
        />

        <Input
          label="Weight (kg)"
          name="weight"
          type="number"
          value={form.weight}
          onChange={onChange}
          placeholder="65"
          required
          error={errors.weight}
        />
      </div>

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
    </div>
  )
}

export default PersonalInformationForm
