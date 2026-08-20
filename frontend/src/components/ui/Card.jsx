function Card({
  children,
  title,
  subtitle,
  header,
  footer,
  variant = 'default',
  className = '',
}) {
  const variants = {
    default:
      'bg-white border border-border rounded-2xl shadow-card',
    outlined:
      'bg-white border-2 border-border-dark rounded-2xl',
    glass:
      'bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl text-white',
  }

  return (
    <div className={`${variants[variant] || variants.default} overflow-hidden ${className}`}>
      {header && (
        <div className="px-6 py-4 border-b border-border">
          {header}
        </div>
      )}
      {title && !header && (
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-text-dark">{title}</h3>
          {subtitle && (
            <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-border bg-surface-soft">
          {footer}
        </div>
      )}
    </div>
  )
}

export default Card
