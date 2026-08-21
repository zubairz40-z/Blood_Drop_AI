import { Heart } from 'lucide-react'
import Button from '../ui/Button'

const amounts = ['৳100', '৳500', '৳1000']

function SupportSection() {
  return (
    <section id="support" className="py-20 sm:py-28 bg-bg scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Contribute</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">Support BloodDrop</h2>
          <p className="text-text-muted mb-8 leading-relaxed">
            BloodDrop AI aims to improve blood-donation coordination. Your support helps us continue development and reach more communities.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {amounts.map((a) => (
              <button
                key={a}
                className="w-24 py-3 text-sm font-semibold rounded-xl border border-border-dark bg-white text-text-dark hover:border-brand hover:text-brand transition-colors cursor-pointer"
              >
                {a}
              </button>
            ))}
            <button className="w-24 py-3 text-sm font-semibold rounded-xl border border-dashed border-border-dark bg-white text-text-muted hover:border-brand hover:text-brand transition-colors cursor-pointer">
              Custom
            </button>
          </div>

          <Button size="lg" icon={Heart} className="px-8">
            Support the Project
          </Button>
        </div>
      </div>
    </section>
  )
}

export default SupportSection
