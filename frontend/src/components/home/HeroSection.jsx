import { ArrowRight, Sparkles, MapPin, Shield } from 'lucide-react'
import { useReducedMotion, motion } from 'framer-motion'
import healthcareImage from '../../assets/healthcare-concept-clinic.jpg'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import HospitalPartnersStrip from './HospitalPartnersStrip'

const secondaryBtn =
  'inline-flex items-center justify-center gap-2 px-7 py-3 text-base font-medium rounded-full border border-white/25 text-white hover:bg-white/10 transition-all duration-200'

const highlights = [
  { icon: Shield, text: 'Compatibility-aware matching' },
  { icon: MapPin, text: 'Location-based coordination' },
  { icon: Sparkles, text: 'Eligibility-aware scheduling' },
]

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }
const fadeLeft = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.7, ease: 'easeOut' } } }
const fadeLeftReduced = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } } }

function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const item = shouldReduceMotion ? fadeLeftReduced : fadeLeft

  const scrollTo = (selector) => (e) => {
    e.preventDefault()
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative pt-16 overflow-hidden">
      <div className="relative min-h-[70vh] lg:min-h-[75vh] flex items-center rounded-b-[0.5rem] overflow-hidden bg-neutral-900">
        <div className="absolute inset-0">
          <img src={healthcareImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/70 via-neutral-900/50 to-neutral-900/70" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blood/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand/5 rounded-full blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 w-full">
          <motion.div
            className="max-w-2xl mb-6 sm:mb-8 lg:mb-8"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={item}>
              <Badge variant="primary" className="mb-6 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Blood Coordination
              </Badge>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6"
              variants={item}
            >
              Find blood. <span className="text-brand">Save lives.</span> Faster.
            </motion.h1>

            <motion.p
              className="text-lg text-neutral-300 leading-relaxed mb-8 max-w-xl"
              variants={item}
            >
              BloodDrop AI connects patients, donors, hospitals, and volunteers through intelligent coordination designed to make urgent blood requests faster and easier to manage.
            </motion.p>

            <motion.div className="flex flex-wrap gap-3 mb-10" variants={item}>
              <Button size="lg" icon={ArrowRight} iconPosition="right" onClick={scrollTo('#how-it-works')}>
                Request Blood
              </Button>

              <a href="#donors" onClick={scrollTo('#donors')} className={secondaryBtn}>
                Become a Donor
              </a>
            </motion.div>

            <motion.div className="flex flex-wrap gap-x-6 gap-y-3" variants={item}>
              {highlights.map((h) => (
                <div key={h.text} className="flex items-center gap-2 text-sm text-neutral-400">
                  <h.icon className="w-4 h-4 text-brand" />
                  {h.text}
                </div>
              ))}
            </motion.div>
          </motion.div>

          <HospitalPartnersStrip />
        </div>
      </div>
    </section>
  )
}

export default HeroSection
