import { Building2, Droplet, Users, Heart, Stethoscope } from 'lucide-react'

const partners = [
  { icon: Building2, label: 'Hospitals' },
  { icon: Droplet, label: 'Blood Banks' },
  { icon: Users, label: 'Volunteers' },
  { icon: Heart, label: 'Communities' },
  { icon: Stethoscope, label: 'Healthcare Teams' },
]

function SupportStrip() {
  return (
    <section className="relative -mt-10 z-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-elevated border border-border p-6 sm:p-8">
          <p className="text-center text-sm text-text-muted mb-5 font-medium">
            Built for coordinated healthcare support
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {partners.map((p) => (
              <div key={p.label} className="flex items-center gap-2 text-text-secondary">
                <p.icon className="w-5 h-5 text-brand" />
                <span className="text-sm font-medium">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SupportStrip
