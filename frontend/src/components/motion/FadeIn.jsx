import { useReducedMotion, motion } from 'framer-motion'

function FadeIn({ children, className = '', delay = 0, y = 20, x = 0 }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y, x }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

export default FadeIn
