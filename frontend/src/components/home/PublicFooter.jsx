import { Link } from 'react-router-dom'

const footerLinks = {
  Platform: [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Donation Types', href: '#donation-types' },
    { label: 'For Donors', href: '#donors' },
    { label: 'For Hospitals', href: '#hospitals' },
  ],
  Resources: [
    { label: 'AI Coordination', href: '#ai-coordination' },
    { label: 'Support', to: '/funding' },
  ],
  Account: [
    { label: 'Login', href: '/login' },
    { label: 'Register', href: '/register' },
  ],
  Legal: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
  ],
}

function PublicFooter() {
  const handleClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-neutral-900 text-neutral-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8 pb-12 border-b border-neutral-800">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src="/blood-drop.png" alt="" className="w-6 h-6" />
              <span className="text-base font-bold text-white">BloodDrop AI</span>
            </Link>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">
              Intelligent blood donation coordination connecting patients, donors, hospitals, and volunteers.
            </p>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-3">{group}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-sm text-neutral-500 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        onClick={(e) => handleClick(e, link.href)}
                        className="text-sm text-neutral-500 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-neutral-500 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 text-center">
          <p className="text-xs text-neutral-600">
            BloodDrop AI — Intelligent Blood Donation Coordination
          </p>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
