import Badge from '../ui/Badge'

function DashboardPlaceholder({ title, description, role }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-brand-soft flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-bold text-brand">{title?.charAt(0) || 'B'}</span>
        </div>
        <h1 className="text-2xl font-bold text-text-dark mb-2">{title}</h1>
        {role && (
          <Badge variant="primary" className="mb-4">{role}</Badge>
        )}
        <p className="text-text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default DashboardPlaceholder
