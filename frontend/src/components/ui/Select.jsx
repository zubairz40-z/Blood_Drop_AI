import { ChevronDown } from 'lucide-react'

function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
}) {
  const selectId = name || label?.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${selectId}-error` : undefined
  const helperId = helperText && !error ? `${selectId}-helper` : undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-text-charcoal"
        >
          {label}
          {required && <span className="text-blood ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-describedby={errorId || helperId}
          aria-invalid={error ? 'true' : undefined}
          className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 appearance-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-neutral-50 disabled:text-text-light disabled:cursor-not-allowed pr-10 ${
            error
              ? 'border-blood focus:ring-blood/30 focus:border-blood'
              : 'border-border-dark'
          }`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-blood" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  )
}

export default Select
