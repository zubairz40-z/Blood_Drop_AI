const variants = {
  primary: 'bg-brand-soft text-brand',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-blood-soft text-blood',
  info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-neutral-100 text-text-secondary',
}

function Badge({
  children,
  variant = 'neutral',
  className = '',
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${variants[variant] || variants.neutral} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
