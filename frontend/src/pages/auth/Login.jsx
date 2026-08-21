import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import PasswordField from '../../components/auth/PasswordField'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')

  const validate = () => {
    const errs = {}
    if (!form.email.trim()) {
      errs.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email'
    }
    if (!form.password) {
      errs.password = 'Password is required'
    }
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setInfo('')
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setInfo('Authentication will be connected to Firebase in a later integration step.')
    }, 1200)
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  return (
    <AuthLayout>
      <div>
        <h1 className="text-2xl font-bold text-text-dark mb-1">Welcome back</h1>
        <p className="text-sm text-text-muted mb-8">Sign in to continue to BloodDrop AI.</p>

        {info && (
          <Alert variant="info" className="mb-6">
            {info}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            icon={Mail}
            value={form.email}
            onChange={handleChange('email')}
            placeholder="you@example.com"
            error={errors.email}
            required
            autoComplete="email"
          />

          <PasswordField
            name="password"
            value={form.password}
            onChange={handleChange('password')}
            placeholder="Enter your password"
            error={errors.password}
            required
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand hover:text-brand-hover transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Sign In
          </Button>
        </form>

        <p className="text-sm text-text-muted text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-brand hover:text-brand-hover transition-colors">
            Register
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default Login
