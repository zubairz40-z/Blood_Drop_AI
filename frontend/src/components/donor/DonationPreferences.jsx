import { Check } from 'lucide-react'
import { donationTypeOptions } from '../../data/demoDonorData'

function DonationPreferences({ selectedTypes, onChange, error }) {
  function toggleType(typeLabel) {
    const updated = selectedTypes.includes(typeLabel)
      ? selectedTypes.filter((t) => t !== typeLabel)
      : [...selectedTypes, typeLabel]
    onChange(updated)
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {donationTypeOptions.map((type) => {
          const isSelected = selectedTypes.includes(type.label)
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => toggleType(type.label)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-brand bg-brand-soft/40'
                  : 'border-border-dark bg-white hover:border-border-dark hover:bg-neutral-50'
              }`}
              role="checkbox"
              aria-checked={isSelected}
              aria-label={type.label}
            >
              <div
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-brand border-brand'
                    : 'border-border-dark bg-white'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-dark">{type.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{type.description}</p>
              </div>
            </button>
          )
        })}
      </div>
      {error && (
        <p className="text-xs text-blood mt-2" role="alert">{error}</p>
      )}
    </div>
  )
}

export default DonationPreferences
