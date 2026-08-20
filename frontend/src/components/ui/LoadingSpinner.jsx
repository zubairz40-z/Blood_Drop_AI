function LoadingSpinner({ size = 'md', label, className = '' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-label={label || 'Loading'}
    >
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-brand/20 border-t-brand rounded-full animate-spin`}
      />
      {label && (
        <p className="text-sm text-text-muted">{label}</p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default LoadingSpinner
