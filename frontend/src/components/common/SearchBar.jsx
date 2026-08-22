import { useState } from 'react'
import { Search, X } from 'lucide-react'

function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  className = '',
}) {
  const [internalValue, setInternalValue] = useState(value || '')
  const val = value !== undefined ? value : internalValue

  const handleChange = (e) => {
    setInternalValue(e.target.value)
    onChange?.(e)
  }

  const handleClear = () => {
    setInternalValue('')
    onChange?.({ target: { value: '' } })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.(val)
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
      <input
        type="text"
        value={val}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-10 pr-9 py-2.5 text-sm bg-neutral-50 border border-border rounded-xl transition-all duration-200 placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand focus:bg-white"
      />
      {val && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-light hover:text-text-dark transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  )
}

export default SearchBar
