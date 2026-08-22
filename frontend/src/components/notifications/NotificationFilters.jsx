function NotificationFilters({ active, onChange, counts }) {
  const filters = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'unread', label: 'Unread', count: counts.unread },
    { key: 'read', label: 'Read', count: counts.read },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
            active === f.key
              ? 'bg-brand text-white'
              : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
          }`}
        >
          {f.label}
          {f.count > 0 && (
            <span className={`ml-1.5 ${active === f.key ? 'text-white/80' : 'text-text-muted'}`}>
              {f.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export default NotificationFilters
