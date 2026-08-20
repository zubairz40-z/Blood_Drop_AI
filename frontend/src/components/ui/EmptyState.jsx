function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-text-light" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-dark mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export default EmptyState
