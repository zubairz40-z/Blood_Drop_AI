import { useReducedMotion, motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Create Request',
    description: 'Patient or hospital enters blood group, donation type, urgency, and location.',
  },
  {
    number: '02',
    title: 'AI Coordinates',
    description: 'BloodDrop evaluates compatible donors and coordination requirements across the network.',
  },
  {
    number: '03',
    title: 'Donor Responds',
    description: 'A suitable donor receives the request and may accept or decline based on availability.',
  },
  {
    number: '04',
    title: 'Hospital Confirms',
    description: 'Hospital verifies the donor and records the completed donation safely.',
  },
]

const stats = [
  { value: '4', label: 'Workflow Steps' },
  { value: '5', label: 'AI Agents' },
  { value: '4', label: 'Donation Types' },
]

function StepRequestSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <rect x="18" y="10" width="44" height="56" rx="6" stroke="#E5E5E5" strokeWidth="2" fill="white" />
      <rect x="26" y="20" width="28" height="3" rx="1.5" fill="#F72585" />
      <rect x="26" y="28" width="20" height="2" rx="1" fill="#E5E5E5" />
      <rect x="26" y="34" width="28" height="2" rx="1" fill="#E5E5E5" />
      <rect x="26" y="40" width="16" height="2" rx="1" fill="#E5E5E5" />
      <rect x="26" y="48" width="12" height="8" rx="2" stroke="#F72585" strokeWidth="1.5" fill="#FDE7F1" />
      <path d="M30 52 L32 54.5 L36 50" stroke="#F72585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StepAICoordinateSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <circle cx="40" cy="40" r="12" stroke="#F72585" strokeWidth="2" fill="#FDE7F1" />
      <circle cx="40" cy="40" r="5" fill="#F72585" />
      <circle cx="18" cy="22" r="5" stroke="#E5E5E5" strokeWidth="1.5" fill="white" />
      <circle cx="62" cy="22" r="5" stroke="#E5E5E5" strokeWidth="1.5" fill="white" />
      <circle cx="18" cy="58" r="5" stroke="#E5E5E5" strokeWidth="1.5" fill="white" />
      <circle cx="62" cy="58" r="5" stroke="#E5E5E5" strokeWidth="1.5" fill="white" />
      <line x1="23" y1="24" x2="33" y2="35" stroke="#E5E5E5" strokeWidth="1.5" />
      <line x1="57" y1="24" x2="47" y2="35" stroke="#E5E5E5" strokeWidth="1.5" />
      <line x1="23" y1="56" x2="33" y2="45" stroke="#E5E5E5" strokeWidth="1.5" />
      <line x1="57" y1="56" x2="47" y2="45" stroke="#E5E5E5" strokeWidth="1.5" />
    </svg>
  )
}

function StepDonorRespondSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <circle cx="40" cy="30" r="10" stroke="#E5E5E5" strokeWidth="2" fill="white" />
      <path d="M26 58 C26 48 34 42 40 42 C46 42 54 48 54 58" stroke="#E5E5E5" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="50" y="14" width="18" height="14" rx="4" stroke="#F72585" strokeWidth="1.5" fill="white" />
      <path d="M55 21 L58 24 L63 18" stroke="#F72585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="50" y1="21" x2="48" y2="21" stroke="#F72585" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function StepHospitalConfirmSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <rect x="24" y="24" width="32" height="36" rx="4" stroke="#E5E5E5" strokeWidth="2" fill="white" />
      <rect x="32" y="16" width="16" height="12" rx="2" stroke="#E5E5E5" strokeWidth="1.5" fill="white" />
      <line x1="40" y1="18" x2="40" y2="26" stroke="#F72585" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="22" x2="44" y2="22" stroke="#F72585" strokeWidth="2" strokeLinecap="round" />
      <rect x="35" y="36" width="10" height="16" rx="2" stroke="#E5E5E5" strokeWidth="1.5" fill="white" />
      <circle cx="58" cy="20" r="9" fill="#FDE7F1" stroke="#F72585" strokeWidth="1.5" />
      <path d="M54.5 20 L57 22.5 L61.5 17.5" stroke="#F72585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const stepSvgs = [StepRequestSvg, StepAICoordinateSvg, StepDonorRespondSvg, StepHospitalConfirmSvg]

const sectionFade = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }
const sectionFadeReduced = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }
const cardVariant = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }
const cardVariantReduced = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } } }

function HowItWorks() {
  const shouldReduceMotion = useReducedMotion()
  const card = shouldReduceMotion ? cardVariantReduced : cardVariant

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-bg scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-[48%_1fr] gap-12 lg:gap-16 items-start"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={shouldReduceMotion ? sectionFadeReduced : sectionFade}
        >
          <div>
            <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">How our platform works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">How BloodDrop Works</h2>
            <p className="text-text-muted mb-10 max-w-md">
              From request to donation, BloodDrop AI guides the process with intelligent coordination at every step.
            </p>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={stagger}
            >
              {steps.map((s, i) => {
                const Svg = stepSvgs[i]
                return (
                  <motion.div
                    key={s.number}
                    className="bg-white border border-border rounded-[18px] p-5 shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200"
                    variants={card}
                  >
                    <span className="text-2xl font-bold text-brand leading-none">{s.number}</span>
                    <h3 className="text-base font-semibold text-text-dark mt-3 mb-1.5">{s.title}</h3>
                    <p className="text-sm text-text-muted leading-relaxed mb-4">{s.description}</p>
                    <div className="w-full h-20">
                      <Svg />
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
          >
            <motion.div
              className="bg-white border border-border rounded-[20px] shadow-card p-5 mb-5 grid grid-cols-3 divide-x divide-border"
              variants={card}
            >
              {stats.map((s) => (
                <div key={s.label} className="text-center px-2 first:pl-0 last:pr-0">
                  <span className="text-2xl sm:text-3xl font-bold text-text-dark block leading-tight">{s.value}</span>
                  <span className="text-xs text-brand font-medium mt-0.5 block">{s.label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-[#D81B60] via-[#C2185B] to-[#AD1457] rounded-[22px] p-7 sm:p-8 text-white overflow-hidden relative"
              variants={card}
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-2 relative z-10">Intelligent coordination at every step</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6 relative z-10">
                BloodDrop AI brings request details, donor compatibility, eligibility, location, and hospital confirmation into one coordinated workflow.
              </p>

              <div className="rounded-xl overflow-hidden mb-6 relative z-10">
                <img
                  src="/bloodbag.avif"
                  alt="Blood bag prepared for donation and transfusion"
                  className="w-full h-56 sm:h-64 lg:h-72 object-cover"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 relative z-10">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium block mb-0.5">Starts with</span>
                  <span className="text-sm font-semibold text-white">A verified blood request</span>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium block mb-0.5">Completes with</span>
                  <span className="text-sm font-semibold text-white">Hospital confirmation</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorks
