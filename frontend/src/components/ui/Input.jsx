import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    helperText,
    error,
    disabled = false,
    required = false,
    icon: Icon,
    rightContent,
    className = '',
    ...props
  },
  ref,
) {
  const inputId = name || label?.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${inputId}-error` : undefined
  const helperId = helperText && !error ? `${inputId}-helper` : undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-charcoal"
        >
          {label}
          {required && <span className="text-blood ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-describedby={errorId || helperId}
          aria-invalid={error ? 'true' : undefined}
          className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-[#F72585]/30 focus:border-[#F72585] disabled:bg-neutral-50 disabled:text-text-light disabled:cursor-not-allowed ${
            error
              ? 'border-blood focus:ring-blood/30 focus:border-blood'
              : 'border-border-dark'
          } ${Icon ? 'pl-10' : ''} ${rightContent ? 'pr-10' : ''}`}
          {...props}
        />
        {rightContent && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light">
            {rightContent}
          </div>
        )}
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
})

export default Input
