import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import Card from '../ui/Card'

function DonorProfileSummary({ name, bloodGroup, availability, completeness = 0 }) {
  return (
    <Card className="h-fit">
      <div className="flex flex-col items-center text-center">
        <Avatar name={name} size="xl" />
        <h3 className="text-lg font-semibold text-text-dark mt-4">{name}</h3>
        <p className="text-sm text-text-muted mt-0.5">Donor profile</p>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-base font-bold text-text-dark">{bloodGroup}</span>
          <Badge variant={availability ? 'success' : 'warning'}>
            {availability ? 'Available' : 'Busy'}
          </Badge>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Profile completeness</span>
          <span className="font-semibold text-text-dark">{completeness}%</span>
        </div>
        <div className="mt-2 h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>
    </Card>
  )
}

export default DonorProfileSummary
