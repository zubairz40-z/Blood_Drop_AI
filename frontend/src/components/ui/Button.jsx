import { Loader2 } from 'lucide-react'

const variants = {
  primary:
    'bg-[#F72585] hover:bg-[#E91E72] text-white shadow-sm active:scale-[0.97]',
  secondary:
    'bg-neutral-100 hover:bg-neutral-200 text-text-charcoal border border-border',
  outline:
    'bg-transparent hover:bg-neutral-50 text-text-dark border border-border-dark',
  ghost:
    'bg-transparent hover:bg-neutral-100 text-text-secondary',
  danger:
    'bg-blood hover:bg-blood-dark text-white shadow-sm active:scale-[0.97]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3 text-base gap-2.5',
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F72585] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </button>
  )
}

export default Button
