import { CheckCircle, Building2 } from 'lucide-react'
import Badge from '../ui/Badge'

function HospitalSection() {
  return (
    <section id="hospitals" className="py-20 sm:py-28 bg-bg scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="bg-white border border-border rounded-2xl shadow-card p-6 max-w-sm mx-auto space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-brand" />
                <span className="text-sm font-semibold text-text-dark">ABC Medical Center</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Active Requests</span>
                <span className="text-sm font-bold text-blood">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Matched Donors</span>
                <span className="text-sm font-bold text-brand">7</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Donations Today</span>
                <span className="text-sm font-bold text-emerald-600">4</span>
              </div>
              <div className="h-px bg-border" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Emergency #1042</span>
                  <Badge variant="error">CRITICAL</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Request #1043</span>
                  <Badge variant="warning">URGENT</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">For Hospitals</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-4 leading-tight">
              Faster Coordination for Hospitals
            </h2>
            <p className="text-text-muted mb-6 leading-relaxed">
              Create verified blood requests, review matched donors, confirm donations, and manage blood inventory through a coordinated platform.
            </p>
            <ul className="space-y-3">
              {[
                'Create and verify blood requests',
                'Review AI-matched donor candidates',
                'Confirm donors and track donations',
                'Manage blood inventory records',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <CheckCircle className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HospitalSection
