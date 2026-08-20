import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <img src="/blood-drop.png" alt="BloodDrop AI" className="w-10 h-10" />
          <h1 className="text-4xl font-bold text-text-dark">BloodDrop AI</h1>
        </div>
        <p className="text-text-muted">Frontend setup successful.</p>
        <Link
          to="/design-system"
          className="inline-block text-sm font-medium text-brand hover:text-brand-hover transition-colors"
        >
          View Design System
        </Link>
      </div>
    </div>
  )
}

export default Home
