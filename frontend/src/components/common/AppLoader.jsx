import { useReducedMotion, motion } from 'framer-motion'

function BloodDropSVG() {
  return (
    <svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 2C16 2 4 18 4 26C4 32.627 9.373 38 16 38C22.627 38 28 32.627 28 26C28 18 16 2 16 2Z"
        fill="#DC2626"
      />
      <ellipse cx="12" cy="24" rx="3" ry="4" fill="#B91C1C" opacity="0.3" />
    </svg>
  )
}

const dropFall = {
  initial: { opacity: 0, y: -35 },
  animate: {
    opacity: 1,
    y: [-35, 15, 10],
    transition: { duration: 0.5, ease: 'easeOut', times: [0, 0.7, 1] },
  },
}

const dropFallReduced = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

const rippleAnim = {
  initial: { scale: 0.5, opacity: 0.4 },
  animate: {
    scale: [0.5, 1.5],
    opacity: [0.4, 0],
    transition: { duration: 0.6, ease: 'easeOut', delay: 0.45 },
  },
}

const textFade = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut', delay: 0.3 },
  },
}

function AppLoader({ message = 'Connecting lives...' }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <motion.div
            variants={shouldReduceMotion ? dropFallReduced : dropFall}
            initial="initial"
            animate="animate"
          >
            <BloodDropSVG />
          </motion.div>

          {!shouldReduceMotion && (
            <motion.div
              className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-8 h-3 rounded-full border border-blood/30"
              variants={rippleAnim}
              initial="initial"
              animate="animate"
            />
          )}
        </div>

        <motion.div
          className="text-center"
          variants={textFade}
          initial="initial"
          animate="animate"
        >
          <h1 className="text-xl font-bold text-text-dark tracking-tight">
            Blood<span className="text-brand">Drop</span>{' '}
            <span className="text-[10px] font-bold bg-brand-soft text-brand px-1.5 py-0.5 rounded-full align-top relative -top-1">AI</span>
          </h1>
          <p className="mt-1.5 text-xs text-text-muted tracking-wide">{message}</p>
        </motion.div>
      </div>
    </div>
  )
}

export { AppLoader }
export default AppLoader
