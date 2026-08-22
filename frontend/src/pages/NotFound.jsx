import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import Button from '../components/ui/Button'

function NotFound() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4"
    >
      <div className="max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-brand-soft flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-brand">404</span>
        </div>
        <h1 className="text-2xl font-bold text-text-dark mb-2">Page Not Found</h1>
        <p className="text-text-muted leading-relaxed mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button icon={Home} onClick={() => navigate('/')}>
          Back Home
        </Button>
      </div>
    </motion.div>
  )
}

export default NotFound
