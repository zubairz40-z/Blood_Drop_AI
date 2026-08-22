const levels = [
  {
    value: 'NORMAL',
    label: 'NORMAL',
    description: 'Standard coordination',
    color: 'border-blue-300 bg-blue-50 text-blue-700',
    activeColor: 'border-blue-500 bg-blue-100 text-blue-800 ring-2 ring-blue-500/20',
  },
  {
    value: 'URGENT',
    label: 'URGENT',
    description: 'Needs faster coordination',
    color: 'border-amber-300 bg-amber-50 text-amber-700',
    activeColor: 'border-amber-500 bg-amber-100 text-amber-800 ring-2 ring-amber-500/20',
  },
  {
    value: 'CRITICAL',
    label: 'CRITICAL',
    description: 'Immediate coordination required',
    color: 'border-blood/30 bg-blood-soft text-blood',
    activeColor: 'border-blood bg-blood-soft text-blood-dark ring-2 ring-blood/20',
  },
]

function EmergencyLevelSelector({ value, onChange, error }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-charcoal">
        Emergency Level <span className="text-blood ml-0.5">*</span>
      </p>
      <div className="grid grid-cols-3 gap-3">
        {levels.map((level) => {
          const isActive = value === level.value
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                isActive ? level.activeColor : `${level.color} hover:opacity-80`
              }`}
            >
              <p className="text-sm font-semibold">{level.label}</p>
              <p className="text-xs mt-1 opacity-80">{level.description}</p>
            </button>
          )
        })}
      </div>
      {error && (
        <p className="text-xs text-blood" role="alert">{error}</p>
      )}
    </div>
  )
}

export default EmergencyLevelSelector
