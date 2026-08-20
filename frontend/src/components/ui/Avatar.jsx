import { useState } from 'react'

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
}

const statusColors = {
  online: 'bg-emerald-400',
  away: 'bg-amber-400',
  offline: 'bg-neutral-300',
  busy: 'bg-blood',
}

function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  status,
  className = '',
}) {
  const [imgError, setImgError] = useState(false)

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const showImage = src && !imgError

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full overflow-hidden flex items-center justify-center bg-brand-soft text-brand font-semibold`}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials || '?'}</span>
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusColors[status] || statusColors.offline}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  )
}

export default Avatar
