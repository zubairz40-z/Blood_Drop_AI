import { useReducedMotion, motion } from 'framer-motion'

const types = [
  {
    title: 'Whole Blood',
    description: 'The most common donation type, supporting a broad range of transfusion needs.',
    featured: true,
  },
  {
    title: 'Plasma',
    description: 'Plasma supports patients who need essential proteins and clotting components carried in blood.',
    featured: false,
  },
  {
    title: 'Platelets',
    description: 'Platelet donations can support patients whose blood needs additional help with clotting.',
    featured: false,
  },
  {
    title: 'Double Red Cells',
    description: 'A donation process focused on collecting a larger red-cell component while returning other components to the donor.',
    featured: false,
  },
]

function WholeBloodSvg() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full h-full">
      <rect x="30" y="8" width="36" height="52" rx="6" stroke="#DC2626" strokeWidth="2" fill="#FEE2E2" />
      <rect x="38" y="4" width="20" height="8" rx="2" stroke="#DC2626" strokeWidth="1.5" fill="white" />
      <path d="M48 22 C48 22 38 36 38 42 C38 47.5 42.5 52 48 52 C53.5 52 58 47.5 58 42 C58 36 48 22 48 22Z" fill="#DC2626" />
      <ellipse cx="45" cy="40" rx="2" ry="3" fill="#B91C1C" opacity="0.3" />
      <line x1="30" y1="28" x2="66" y2="28" stroke="#DC2626" strokeWidth="1" opacity="0.3" />
      <circle cx="90" cy="40" r="14" stroke="#E5E5E5" strokeWidth="1.5" fill="white" />
      <path d="M90 28 C90 28 82 38 82 42 C82 46.4 85.6 50 90 50 C94.4 50 98 46.4 98 42 C98 38 90 28 90 28Z" fill="#DC2626" opacity="0.2" />
    </svg>
  )
}

function PlasmaSvg() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full h-full">
      <rect x="30" y="8" width="36" height="52" rx="6" stroke="#F59E0B" strokeWidth="2" fill="#FEF3C7" />
      <rect x="38" y="4" width="20" height="8" rx="2" stroke="#F59E0B" strokeWidth="1.5" fill="white" />
      <rect x="36" y="36" width="24" height="20" rx="3" fill="#FBBF24" opacity="0.5" />
      <rect x="36" y="26" width="24" height="10" rx="3" fill="#DC2626" opacity="0.3" />
      <line x1="30" y1="24" x2="66" y2="24" stroke="#F59E0B" strokeWidth="1" opacity="0.3" />
      <circle cx="90" cy="40" r="14" stroke="#E5E5E5" strokeWidth="1.5" fill="white" />
      <circle cx="90" cy="40" r="8" fill="#FBBF24" opacity="0.3" />
      <circle cx="90" cy="40" r="4" fill="#F59E0B" opacity="0.5" />
    </svg>
  )
}

function PlateletsSvg() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full h-full">
      <rect x="30" y="8" width="36" height="52" rx="6" stroke="#3B82F6" strokeWidth="2" fill="#DBEAFE" />
      <rect x="38" y="4" width="20" height="8" rx="2" stroke="#3B82F6" strokeWidth="1.5" fill="white" />
      <circle cx="42" cy="34" r="4" fill="#93C5FD" />
      <circle cx="52" cy="38" r="3" fill="#60A5FA" />
      <circle cx="46" cy="46" r="3.5" fill="#93C5FD" />
      <circle cx="54" cy="30" r="2.5" fill="#BFDBFE" />
      <circle cx="40" cy="42" r="2" fill="#BFDBFE" />
      <circle cx="90" cy="40" r="14" stroke="#E5E5E5" strokeWidth="1.5" fill="white" />
      <circle cx="86" cy="36" r="3" fill="#93C5FD" />
      <circle cx="94" cy="42" r="2.5" fill="#60A5FA" />
      <circle cx="88" cy="46" r="2" fill="#BFDBFE" />
      <circle cx="92" cy="34" r="1.5" fill="#93C5FD" />
    </svg>
  )
}

function DoubleRedCellsSvg() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full h-full">
      <rect x="20" y="12" width="32" height="48" rx="6" stroke="#DC2626" strokeWidth="2" fill="#FEE2E2" />
      <rect x="26" y="8" width="20" height="8" rx="2" stroke="#DC2626" strokeWidth="1.5" fill="white" />
      <ellipse cx="36" cy="38" rx="10" ry="14" fill="#DC2626" opacity="0.4" />
      <rect x="68" y="12" width="32" height="48" rx="6" stroke="#E5E5E5" strokeWidth="1.5" fill="white" />
      <rect x="74" y="8" width="20" height="8" rx="2" stroke="#E5E5E5" strokeWidth="1.5" fill="white" />
      <rect x="72" y="28" width="24" height="24" rx="3" fill="#FEF3C7" opacity="0.6" />
      <line x1="52" y1="36" x2="68" y2="36" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="60" cy="36" r="3" fill="#DC2626" />
      <path d="M58 36 L60 38 L62 34" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const typeSvgs = [WholeBloodSvg, PlasmaSvg, PlateletsSvg, DoubleRedCellsSvg]

const sectionFade = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }
const sectionFadeReduced = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }
const cardVariant = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }
const cardVariantReduced = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } } }

function DonationTypes() {
  const shouldReduceMotion = useReducedMotion()
  const card = shouldReduceMotion ? cardVariantReduced : cardVariant

  return (
    <section id="donation-types" className="py-20 sm:py-28 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={shouldReduceMotion ? sectionFadeReduced : sectionFade}
        >
          <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Ways to donate</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">Supported Donation Types</h2>
          <p className="text-text-muted max-w-xl mb-12">
            BloodDrop AI supports several donation types based on patient and hospital needs, each serving a critical role in care.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={stagger}
        >
          {types.map((t, i) => {
            const Svg = typeSvgs[i]
            return (
              <motion.div
                key={t.title}
                className={`border border-border rounded-[20px] p-6 sm:p-7 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 ${
                  t.featured
                    ? 'bg-gradient-to-br from-[#FDE7F1] to-white shadow-card'
                    : 'bg-bg shadow-card'
                }`}
                variants={card}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-text-dark mb-2">{t.title}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{t.description}</p>
                  </div>
                  <div className="w-full sm:w-28 h-20 shrink-0">
                    <Svg />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

export default DonationTypes
