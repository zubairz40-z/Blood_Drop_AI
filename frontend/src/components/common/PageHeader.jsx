import { ArrowLeft } from 'lucide-react'

function PageHeader({
  title,
  description,
  eyebrow,
  onBack,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div className="flex-1 min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-1">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="p-1.5 -ml-1.5 rounded-lg text-text-muted hover:text-text-dark hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-text-dark">{title}</h1>
        </div>
        {description && (
          <p className="text-sm text-text-muted mt-1">{description}</p>
        )}
      </div>
      {action && <div className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">{action}</div>}
    </div>
  )
}

export default PageHeader
