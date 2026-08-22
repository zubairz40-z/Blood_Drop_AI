import { Cpu, Target, Heart, MapPin, ShieldAlert, ArrowDown } from 'lucide-react'
import { useReducedMotion, motion } from 'framer-motion'

const agents = [
  { icon: Cpu, label: 'AI Manager', description: 'Coordinates the entire request lifecycle' },
  { icon: Target, label: 'Donor Matching', description: 'Finds compatible donors by blood type' },
  { icon: Heart, label: 'Eligibility & Scheduling', description: 'Verifies safe donation eligibility' },
  { icon: MapPin, label: 'Geo Coordination', description: 'Locates the nearest available donors' },
  { icon: ShieldAlert, label: 'Risk & Advisor', description: 'Monitors system patterns and anomalies' },
]

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }
const cardUp = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } }
const cardUpReduced = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } } }
const fadeUp = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }
const fadeUpReduced = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } } }

function AICoordinationSection() {
  const shouldReduceMotion = useReducedMotion()
  const cardVariant = shouldReduceMotion ? cardUpReduced : cardUp
  const noteVariant = shouldReduceMotion ? fadeUpReduced : fadeUp

  return (
    <section id="ai-coordination" className="py-20 sm:py-28 bg-bg scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Intelligent System</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">
            Intelligent Coordination Behind Every Request
          </h2>
          <p className="text-text-muted">
            Five specialized agents work together to match, verify, and coordinate blood donations.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
          >
            {agents.slice(0, 3).map((a) => (
              <motion.div
                key={a.label}
                className="bg-white border border-border rounded-2xl p-5 shadow-card hover:shadow-elevated transition-shadow text-center"
                variants={cardVariant}
              >
                <div className="w-12 h-12 rounded-xl bg-brand-soft flex items-center justify-center mx-auto mb-3">
                  <a.icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-sm font-semibold text-text-dark mb-1">{a.label}</h3>
                <p className="text-xs text-text-muted">{a.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="hidden lg:flex justify-center my-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-4 bg-border-dark" />
              <ArrowDown className="w-4 h-4 text-text-light" />
              <div className="w-px h-4 bg-border-dark" />
            </div>
          </div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-lg mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
          >
            {agents.slice(3).map((a) => (
              <motion.div
                key={a.label}
                className="bg-white border border-border rounded-2xl p-5 shadow-card hover:shadow-elevated transition-shadow text-center"
                variants={cardVariant}
              >
                <div className="w-12 h-12 rounded-xl bg-brand-soft flex items-center justify-center mx-auto mb-3">
                  <a.icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-sm font-semibold text-text-dark mb-1">{a.label}</h3>
                <p className="text-xs text-text-muted">{a.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-8 max-w-xl mx-auto bg-white border border-border rounded-2xl p-5 shadow-card text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={noteVariant}
          >
            <p className="text-sm text-text-muted leading-relaxed">
              Critical compatibility, eligibility, and distance logic remains deterministic while AI supports coordination, recommendations, and advisory insights.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default AICoordinationSection
