import { CheckCircle } from 'lucide-react'
import { useReducedMotion, motion } from 'framer-motion'
import bereadyImg from '../../assets/healthcare-concept-clinic.jpg'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } } }
const fadeUpReduced = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } } }
const fadeLeft = { hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: 'easeOut' } } }

const bullets = [
  'Maintain donation profile and preferences',
  'Update availability in real time',
  'Receive nearby emergency notifications',
  'Track donation history and eligibility',
]

function DonorSection() {
  const shouldReduceMotion = useReducedMotion()
  const imageVariant = shouldReduceMotion ? fadeUpReduced : fadeLeft
  const textVariant = shouldReduceMotion ? fadeUpReduced : fadeUp

  return (
    <section id="donors" className="py-20 sm:py-28 bg-bg scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Image — left on desktop, first on mobile */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={imageVariant}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img
                src={bereadyImg}
                alt="Donor preparing to save lives"
                className="w-full h-72 sm:h-80 lg:h-96 object-cover"
              />
              {/* Subtle brand-tinted overlay at the bottom edge */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand/20 to-transparent pointer-events-none" />
            </div>
          </motion.div>

          {/* Text — right on desktop, second on mobile */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={textVariant}
          >
            <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">
              For Donors
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-4 leading-tight">
              Be Ready When Someone Needs You
            </h2>
            <p className="text-text-muted mb-6 leading-relaxed">
              Maintain your donation profile, choose supported donation types, and stay informed when nearby emergency requests match your availability.
            </p>

            <ul className="space-y-3">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <CheckCircle className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

export default DonorSection
