import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

const variants = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  error: {
    container: 'bg-blood-soft border-blood/20 text-blood-dark',
    icon: XCircle,
    iconColor: 'text-blood',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
  },
}

function Alert({
  children,
  title,
  variant = 'info',
  icon: CustomIcon,
  onDismiss,
  className = '',
}) {
  const config = variants[variant] || variants.info
  const IconComponent = CustomIcon || config.icon

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border ${config.container} ${className}`}
    >
      <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default Alert
