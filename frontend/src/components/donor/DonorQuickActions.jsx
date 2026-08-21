import { useNavigate } from 'react-router-dom'
import { ToggleRight, Siren, History, UserRound } from 'lucide-react'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

function DonorQuickActions({ available, onToggleAvailability }) {
  const navigate = useNavigate()

  const actions = [
    {
      label: available ? 'Set Busy' : 'Set Available',
      icon: ToggleRight,
      color: available ? 'text-amber-600' : 'text-emerald-600',
      bg: available ? 'bg-amber-50' : 'bg-emerald-50',
      onClick: onToggleAvailability,
    },
    {
      label: 'Emergency Requests',
      icon: Siren,
      color: 'text-blood',
      bg: 'bg-blood-soft',
      onClick: () => navigate('/donor/requests'),
    },
    {
      label: 'Donation History',
      icon: History,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      onClick: () => navigate('/donor/history'),
    },
    {
      label: 'Update Profile',
      icon: UserRound,
      color: 'text-brand',
      bg: 'bg-brand-soft',
      onClick: () => navigate('/donor/profile'),
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <motion.button
            key={action.label}
            variants={item}
            onClick={action.onClick}
            className="flex flex-col items-center gap-2.5 p-4 bg-white border border-border rounded-2xl shadow-card hover:shadow-elevated transition-all cursor-pointer group"
          >
            <div className={`p-3 rounded-xl ${action.bg} group-hover:scale-105 transition-transform`}>
              <Icon className={`w-5 h-5 ${action.color}`} />
            </div>
            <span className="text-sm font-medium text-text-charcoal text-center">
              {action.label}
            </span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}

export default DonorQuickActions
