import { CheckCircle, Clock, MapPin } from 'lucide-react'
import { useReducedMotion, motion } from 'framer-motion'
import Badge from '../ui/Badge'
import Card from '../ui/Card'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } } }
const fadeUpReduced = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } } }
const fadeRight = { hidden: { opacity: 0, x: 25 }, visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: 'easeOut' } } }

function DonorSection() {
  const shouldReduceMotion = useReducedMotion()
  const textVariant = shouldReduceMotion ? fadeUpReduced : fadeUp
  const cardVariant = shouldReduceMotion ? fadeUpReduced : fadeRight

  return (
    <section id="donors" className="py-20 sm:py-28 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={textVariant}
          >
            <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">For Donors</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-4 leading-tight">
              Be Ready When Someone Needs You
            </h2>
            <p className="text-text-muted mb-6 leading-relaxed">
              Maintain your donation profile, choose supported donation types, and stay informed when nearby emergency requests match your availability.
            </p>
            <ul className="space-y-3">
              {[
                'Maintain donation profile and preferences',
                'Update availability in real time',
                'Receive nearby emergency notifications',
                'Track donation history and eligibility',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <CheckCircle className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={cardVariant}
          >
            <Card className="max-w-sm mx-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Blood Group</span>
                  <span className="text-lg font-bold text-brand">O+</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Eligibility</span>
                  <Badge variant="success">ELIGIBLE</Badge>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Availability</span>
                  <Badge variant="primary">AVAILABLE</Badge>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Nearby Request</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-text-dark">
                    <MapPin className="w-3.5 h-3.5 text-brand" /> 2.4 km
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Next Donation</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-text-dark">
                    <Clock className="w-3.5 h-3.5 text-text-muted" /> Aug 25
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default DonorSection
