import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Input from '../ui/Input'

function PasswordField({
  label = 'Password',
  name = 'password',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  autoComplete = 'current-password',
  className = '',
}) {
  const [show, setShow] = useState(false)

  return (
    <div className={className}>
      <Input
        label={label}
        name={name}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        error={error}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        rightContent={
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="p-0.5 rounded text-text-light hover:text-text-dark transition-colors cursor-pointer"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
    </div>
  )
}

export default PasswordField
