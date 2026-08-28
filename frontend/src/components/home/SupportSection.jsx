import { useState } from 'react'
import Button from '../ui/Button'
import FadeIn from '../motion/FadeIn'
import BkashLogo from '../icons/BkashLogo'
import { useNavigate } from 'react-router-dom'

const amounts = ['৳100', '৳500', '৳1000']

function SupportSection() {
  const navigate = useNavigate()
  const [selectedAmount, setSelectedAmount] = useState(amounts[0])

  // Jumps straight to the funding page with the chosen amount pre-filled.
  function goToFunding(amount) {
    setSelectedAmount(amount)
    navigate(`/funding?amount=${encodeURIComponent(amount.replace('৳', ''))}`)
  }

  function openSupportPage() {
    goToFunding(selectedAmount === 'custom' ? '' : selectedAmount)
  }

  return (
    <section id="support" className="py-20 sm:py-28 bg-bg scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Contribute</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">Support BloodDrop</h2>
          <p className="text-text-muted mb-8 leading-relaxed">
            BloodDrop AI aims to improve blood-donation coordination. Your support helps us continue development and reach more communities.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {amounts.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => goToFunding(a)}
                className={`w-24 py-3 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${selectedAmount === a ? 'border-brand bg-brand-soft text-brand' : 'border-border-dark bg-white text-text-dark hover:border-brand hover:text-brand'}`}
              >
                {a}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate('/funding?amount=custom')}
              className={`w-24 py-3 text-sm font-semibold rounded-xl border border-dashed transition-colors cursor-pointer ${selectedAmount === 'custom' ? 'border-brand bg-brand-soft text-brand' : 'border-border-dark bg-white text-text-muted hover:border-brand hover:text-brand'}`}
            >
              Custom
            </button>
          </div>

          <Button type="button" size="lg" icon={BkashLogo} onClick={openSupportPage} className="px-8">
            Support the Project
          </Button>
        </FadeIn>
      </div>
    </section>
  )
}

export default SupportSection
