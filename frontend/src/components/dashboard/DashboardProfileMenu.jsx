import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, User, Settings, LogOut } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'

function DashboardProfileMenu({ name = 'Demo User', role = 'Donor' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <Avatar name={name} size="sm" />
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-medium text-text-dark leading-tight">{name}</span>
          <span className="text-[11px] text-text-muted leading-tight">{role}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 hidden sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-xl shadow-elevated overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-text-dark">{name}</p>
            <Badge variant="primary" className="mt-1">{role}</Badge>
          </div>
          <div className="py-1">
            <Link
              to="#"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral-50 hover:text-text-dark transition-colors"
              onClick={() => setOpen(false)}
            >
              <User className="w-4 h-4" />
              View Profile
            </Link>
            <Link
              to="#"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral-50 hover:text-text-dark transition-colors"
              onClick={() => setOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
          <div className="border-t border-border py-1">
            <Link
              to="/login"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral-50 hover:text-text-dark transition-colors"
              onClick={() => setOpen(false)}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardProfileMenu
