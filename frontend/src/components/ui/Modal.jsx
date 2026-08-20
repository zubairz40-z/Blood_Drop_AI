import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showClose = true,
  className = '',
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${sizeClasses[size] || sizeClasses.md} bg-white rounded-2xl shadow-elevated border border-border overflow-hidden ${className}`}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            {title && (
              <h2 className="text-lg font-semibold text-text-dark">
                {title}
              </h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-dark hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-surface-soft">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
