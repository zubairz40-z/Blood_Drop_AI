import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import PasswordField from '../../components/auth/PasswordField'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../../config/firebase'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { signInWithGoogle } from '../../api/googleAuth'

function Login() {
  const navigate = useNavigate()
  const { setProfile } = useAuth()
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

    const DASHBOARD_BY_ROLE = {
    patient: '/patient',
    donor: '/donor',
    hospital: '/hospital',
    volunteer: '/volunteer',
    admin: '/admin',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setInfo('')
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password)
      const { data } = await api.post('/api/auth/login')
      setProfile(data.user)
      navigate(DASHBOARD_BY_ROLE[data.user.role] || '/', { replace: true })
    } catch (err) {
      if (auth.currentUser && !err.code) {
        await signOut(auth)
      }
      setInfo(friendlyMessage(err))
      setLoading(false)
    }
  }

    const handleGoogleSignIn = async () => {
    setInfo('')
    setErrors({})
    setLoading(true)

    try {
      const result = await signInWithGoogle()

      if (result.status === 'new') {
        // No BloodDrop profile yet — finish signup with a role
        navigate('/register', { state: { googleInfo: result.googleInfo } })
        return
      }

      setProfile(result.user)
      navigate(DASHBOARD_BY_ROLE[result.user.role] || '/', { replace: true })
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false)
        return
      }
      setInfo(friendlyMessage(err))
      setLoading(false)
    }
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

                <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border-dark" />
          <span className="text-xs text-text-muted">or</span>
          <div className="flex-1 h-px bg-border-dark" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border-2 border-border-dark bg-white hover:border-brand/50 transition-colors cursor-pointer disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.15 6.16-4.15z"/>
          </svg>
          <span className="text-sm font-medium text-text-dark">Continue with Google</span>
        </button>

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

function friendlyMessage(err) {
  switch (err.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Wrong email or password.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Try again in a few minutes.'
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase.'
    default:
      return err.response?.data?.message || err.message || 'Something went wrong.'
  }
}

export default Login
