const variants = {
  primary: 'bg-brand-soft text-brand',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-blood-soft text-blood',
  info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-neutral-100 text-text-secondary',
}

const roleVariants = {
  donor: 'bg-emerald-50 text-emerald-700',
  patient: 'bg-blue-50 text-blue-700',
  hospital: 'bg-brand-soft text-brand',
  volunteer: 'bg-amber-50 text-amber-700',
  admin: 'bg-neutral-800 text-white',
}

function Badge({
  children,
  variant = 'neutral',
  className = '',
}) {
  const roleKey = variant.startsWith('role-') ? variant.replace('role-', '') : null
  const roleStyle = roleKey && roleVariants[roleKey] ? roleVariants[roleKey] : null
  const style = roleStyle || variants[variant] || variants.neutral

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${style} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
