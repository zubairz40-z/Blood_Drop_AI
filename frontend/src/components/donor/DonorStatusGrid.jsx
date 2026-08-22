import { Droplets, ShieldCheck, Calendar, ToggleLeft, HeartHandshake } from 'lucide-react'
import { motion } from 'framer-motion'
import Badge from '../ui/Badge'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

function DonorStatusGrid({ donor, available, onToggleAvailability }) {
  const cards = [
    {
      title: 'Blood Group',
      value: donor.bloodGroup,
      icon: Droplets,
      iconBg: 'bg-blood-soft',
      iconColor: 'text-blood',
      description: 'Your blood type',
    },
    {
      title: 'Eligibility',
      value: donor.eligibilityStatus,
      icon: ShieldCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      badge: { text: 'Eligible', variant: 'success' },
      description: 'You are currently eligible to donate',
    },
    {
      title: 'Next Eligible Date',
      value: donor.nextEligibleDate || 'Eligible now',
      icon: Calendar,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: donor.nextEligibleDate ? 'You can donate again after this date' : 'No wait period',
    },
    {
      title: 'Availability',
      value: available ? 'AVAILABLE' : 'BUSY',
      icon: ToggleLeft,
      iconBg: available ? 'bg-emerald-50' : 'bg-amber-50',
      iconColor: available ? 'text-emerald-600' : 'text-amber-600',
      badge: { text: available ? 'Available' : 'Busy', variant: available ? 'success' : 'warning' },
      action: (
        <button
          onClick={onToggleAvailability}
          className="mt-2 text-xs font-medium text-brand hover:text-brand-hover transition-colors cursor-pointer"
        >
          {available ? 'Set Busy' : 'Set Available'}
        </button>
      ),
    },
    {
      title: 'Total Donations',
      value: donor.totalDonations,
      icon: HeartHandshake,
      iconBg: 'bg-brand-soft',
      iconColor: 'text-brand',
      description: 'Completed donations',
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
    >
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            variants={item}
            className="bg-white border border-border rounded-2xl shadow-card p-5 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide truncate">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-text-dark mt-1">{card.value}</p>
                {card.badge && (
                  <Badge variant={card.badge.variant} className="mt-2">
                    {card.badge.text}
                  </Badge>
                )}
                {card.description && (
                  <p className="text-xs text-text-muted mt-1">{card.description}</p>
                )}
                {card.action}
              </div>
              <div className={`p-3 rounded-xl flex-shrink-0 ${card.iconBg}`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

export default DonorStatusGrid
