import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')

  const validate = () => {
    if (!email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email'
    return ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setInfo('')
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setInfo('Password reset will be connected to Firebase in a later integration step.')
    }, 1200)
  }

  return (
    <AuthLayout>
      <div>
        <h1 className="text-2xl font-bold text-text-dark mb-1">Reset your password</h1>
        <p className="text-sm text-text-muted mb-8">
          Enter your email and we&apos;ll prepare your password reset request.
        </p>

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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError('')
            }}
            placeholder="you@example.com"
            error={error}
            required
            autoComplete="email"
          />

          <Button type="submit" loading={loading} className="w-full">
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default ForgotPassword
