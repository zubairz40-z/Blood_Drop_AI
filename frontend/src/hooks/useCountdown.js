import { useState, useEffect, useCallback } from 'react'

/**
 * Hook that counts down to a target timestamp.
 *
 * @param {string|null} expiresAt — ISO-8601 deadline from the backend
 * @returns {{ remainingSeconds, expired, formatted }}
 *   remainingSeconds: number (0 when expired or no deadline)
 *   expired: boolean
 *   formatted: string like "01:42" or "Expired"
 */
export function useCountdown(expiresAt) {
  const calcRemaining = useCallback(() => {
    if (!expiresAt) return 0
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
    return Math.max(0, diff)
  }, [expiresAt])

  const [remainingSeconds, setRemainingSeconds] = useState(calcRemaining)

  useEffect(() => {
    setRemainingSeconds(calcRemaining())

    if (!expiresAt) return

    const id = setInterval(() => {
      setRemainingSeconds(calcRemaining())
    }, 1000)

    return () => clearInterval(id)
  }, [expiresAt, calcRemaining])

  const expired = remainingSeconds <= 0
  const mins = Math.floor(remainingSeconds / 60)
  const secs = remainingSeconds % 60
  const formatted = expired
    ? 'Expired'
    : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return { remainingSeconds, expired, formatted }
}
