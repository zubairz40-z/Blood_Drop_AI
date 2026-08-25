import Select from '../ui/Select'
import Input from '../ui/Input'
import { bloodGroupOptions, donationTypeOptions } from '../../data/demoDonorData'

function BloodRequirementForm({ form, errors, onChange }) {
  return (
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
      <Select
        label="Donation Type"
        name="donationType"
        value={form.donationType}
        onChange={onChange}
        options={donationTypeOptions.map((d) => ({ value: d.label, label: d.label }))}
        placeholder="Select donation type"
        required
        error={errors.donationType}
      />
      <Input
        label="Units Required"
        name="units"
        type="number"
        value={form.units}
        onChange={onChange}
        placeholder="e.g. 2"
        required
        error={errors.units}
        helperText="Minimum 1 unit"
      />
      <Input
        label="Needed By"
        name="neededBy"
        type="datetime-local"
        value={form.neededBy}
        onChange={onChange}
        required
        error={errors.neededBy}
        helperText="When the blood is needed"
      />
    </div>
  )
}

export default BloodRequirementForm
