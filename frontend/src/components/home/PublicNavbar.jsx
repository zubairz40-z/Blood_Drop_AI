import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useReducedMotion, motion } from 'framer-motion'

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Donation Types', href: '#donation-types' },
  { label: 'AI Coordination', href: '#ai-coordination' },
  { label: 'For Donors', href: '#donors' },
  { label: 'For Hospitals', href: '#hospitals' },
  { label: 'Support', to: '/funding' },
]

function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const handleClick = (e, href) => {
    e.preventDefault()
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/blood-drop.png" alt="" className="w-7 h-7" />
            <span className="text-lg font-bold text-text-dark">BloodDrop</span>
            <span className="text-[10px] font-bold bg-brand-soft text-brand px-1.5 py-0.5 rounded-full">AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-dark rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleClick(e, link.href)}
                  className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-dark rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-dark transition-colors rounded-lg hover:bg-neutral-50">
              Login
            </Link>
            <Link to="/register" className="px-5 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-full transition-colors shadow-sm">
              Register
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
          <div className="md:hidden border-t border-border bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-dark rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleClick(e, link.href)}
                  className="block px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-dark rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  {link.label}
                </a>
              )
            ))}
            <div className="pt-3 border-t border-border flex gap-2">
              <Link to="/login" className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-neutral-50 transition-colors">
                Login
              </Link>
              <Link to="/register" className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-full transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  )
}

export default PublicNavbar
