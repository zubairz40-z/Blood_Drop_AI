import { ClipboardList, Cpu, UserCheck, Building2 } from 'lucide-react'

const steps = [
  {
    icon: ClipboardList,
    title: 'Create Request',
    description: 'Patient or hospital enters blood group, donation type, urgency, and location.',
    step: '01',
  },
  {
    icon: Cpu,
    title: 'AI Coordinates',
    description: 'BloodDrop evaluates compatible donors and coordination requirements across the network.',
    step: '02',
  },
  {
    icon: UserCheck,
    title: 'Donor Responds',
    description: 'A suitable donor receives the request and may accept or decline based on availability.',
    step: '03',
  },
  {
    icon: Building2,
    title: 'Hospital Confirms',
    description: 'Hospital verifies the donor and records the completed donation safely.',
    step: '04',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-bg scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Simple Process</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">How BloodDrop Works</h2>
          <p className="text-text-muted">
            From request to donation, BloodDrop AI guides the process with intelligent coordination at every step.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.step} className="relative bg-white border border-border rounded-2xl p-6 shadow-card hover:shadow-elevated transition-shadow group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                  <s.icon className="w-5 h-5 text-brand group-hover:text-white transition-colors" />
                </div>
                <span className="text-xs font-bold text-text-light">{s.step}</span>
              </div>
              <h3 className="text-base font-semibold text-text-dark mb-2">{s.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{s.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-border-dark" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
