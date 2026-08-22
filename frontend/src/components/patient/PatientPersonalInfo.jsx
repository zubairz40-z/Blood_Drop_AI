import Input from '../ui/Input'

function PatientPersonalInfo({ form, errors, onChange }) {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="you@email.com"
          error={errors.email}
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
      </div>
    </div>
  )
}

export default PatientPersonalInfo
