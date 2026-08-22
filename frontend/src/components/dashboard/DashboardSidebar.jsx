import { NavLink, Link } from 'react-router-dom'
import { LifeBuoy } from 'lucide-react'

function DashboardSidebar({ navigation = [], roleLabel = '' }) {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:fixed lg:inset-y-0 bg-white z-30">
      <div className="flex items-center gap-2.5 px-5 h-16 bg-brand shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-1.5 bg-white rounded-lg">
            <img src="/blood-drop.png" alt="" className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-white">BloodDrop</span>
          <span className="text-[10px] font-bold bg-white/15 text-white border border-white/20 px-1.5 py-0.5 rounded-full">AI</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 border-r border-border" aria-label="Dashboard navigation">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === `/${roleLabel.toLowerCase()}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-soft text-brand font-semibold shadow-sm shadow-brand/10'
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

      <div className="px-4 py-4 border-t border-border border-r border-border">
        <a
          href="/#support"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-text-muted hover:bg-brand-soft/50 hover:text-brand transition-colors"
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Need help?</span>
        </a>
      </div>
    </aside>
  )
}

export default DashboardSidebar
