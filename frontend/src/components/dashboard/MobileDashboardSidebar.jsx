import { NavLink, Link } from 'react-router-dom'
import { X, LifeBuoy } from 'lucide-react'

function MobileDashboardSidebar({ open, onClose, navigation = [], roleLabel = '' }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-elevated flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <img src="/blood-drop.png" alt="" className="w-6 h-6" />
            <span className="text-lg font-bold text-text-dark">BloodDrop</span>
            <span className="text-[10px] font-bold bg-brand-soft text-brand px-1.5 py-0.5 rounded-full">AI</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard navigation">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === `/${roleLabel.toLowerCase()}`}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-soft text-brand'
                          : 'text-text-secondary hover:bg-neutral-50 hover:text-text-dark'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <a
            href="/#support"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-text-muted hover:bg-neutral-50 hover:text-text-dark transition-colors"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Need help?</span>
          </a>
        </div>
      </aside>
    </div>
  )
}

export default MobileDashboardSidebar
