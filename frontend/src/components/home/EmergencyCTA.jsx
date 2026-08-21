import { AlertTriangle } from 'lucide-react'
import Button from '../ui/Button'
import FadeIn from '../motion/FadeIn'

function EmergencyCTA() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blood via-blood-dark to-blood p-10 sm:p-14 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-5 border border-white/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                Emergency
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Need blood urgently?</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                Start a blood request and let BloodDrop AI coordinate compatible donors in your area.
              </p>
              <Button variant="primary" size="lg" className="bg-white text-blood hover:bg-white/90 border-0 shadow-lg">
                Start a Blood Request
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

export default EmergencyCTA
