import { Droplets, Beaker, Layers, CircleDot } from 'lucide-react'

const types = [
  {
    icon: Droplets,
    title: 'Whole Blood',
    description: 'The most common donation type, supporting a broad range of transfusion needs.',
    color: 'text-blood',
    bg: 'bg-blood-soft',
  },
  {
    icon: Beaker,
    title: 'Plasma',
    description: 'Plasma supports patients who need clotting factors and other essential blood components.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Layers,
    title: 'Platelets',
    description: 'Platelet donations can support patients whose blood has difficulty clotting.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: CircleDot,
    title: 'Double Red Cells',
    description: 'A donation process focused on collecting a larger red-cell component.',
    color: 'text-brand',
    bg: 'bg-brand-soft',
  },
]

function DonationTypes() {
  return (
    <section id="donation-types" className="py-20 sm:py-28 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Donation Types</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">Supported Donation Types</h2>
          <p className="text-text-muted">
            BloodDrop AI supports four recognized blood donation types, each serving a critical role in patient care.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {types.map((t) => (
            <div key={t.title} className="bg-bg border border-border rounded-2xl p-6 hover:shadow-elevated transition-shadow group">
              <div className={`w-12 h-12 rounded-xl ${t.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <t.icon className={`w-6 h-6 ${t.color}`} />
              </div>
              <h3 className="text-base font-semibold text-text-dark mb-2">{t.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{t.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DonationTypes
