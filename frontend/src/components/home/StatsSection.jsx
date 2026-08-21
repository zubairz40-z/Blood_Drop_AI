import { Droplets, Cpu, Users, MapPin } from 'lucide-react'
import { useReducedMotion, motion } from 'framer-motion'
import StatCard from '../ui/StatCard'

const stats = [
  { title: 'Donation Types', value: '4', icon: Droplets, description: 'Supported donation categories' },
  { title: 'AI Agents', value: '5', icon: Cpu, description: 'Specialized coordination agents' },
  { title: 'Core User Roles', value: '4', icon: Users, description: 'Donor, Patient, Hospital, Volunteer' },
  { title: 'Adaptive Search', value: '10→30 km', icon: MapPin, description: 'Expanding radius concept' },
]

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }
const cardUp = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } }
const cardUpReduced = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } } }

function StatsSection() {
  const shouldReduceMotion = useReducedMotion()
  const cardVariant = shouldReduceMotion ? cardUpReduced : cardUp

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Platform Capabilities</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">Built for Scale</h2>
          <p className="text-text-muted">
            BloodDrop AI is designed with the architecture to support comprehensive blood-donation coordination.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={stagger}
        >
          {stats.map((s) => (
            <motion.div key={s.title} variants={cardVariant}>
              <StatCard {...s} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default StatsSection
