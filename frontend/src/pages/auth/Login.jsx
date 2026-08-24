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
import { signInWithGoogle, googleFriendlyMessage } from '../../services/googleAuth'
import GoogleIcon from '../../components/auth/GoogleIcon'

function Login() {
  const navigate = useNavigate()
  const { setProfile } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
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

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleGoogleLogin = async () => {
    setInfo('')
    setErrors({})
    setGoogleLoading(true)

    try {
      await signInWithGoogle()
      const { data } = await api.post('/api/auth/login')
      if (data.user.accountStatus === 'pending') {
        await signOut(auth)
        setInfo('Your account is awaiting admin approval. Please check back later.')
        setGoogleLoading(false)
        return
      }
      if (data.user.accountStatus === 'rejected' || data.user.accountStatus === 'suspended') {
        await signOut(auth)
        setInfo('This account is not active. Please contact support.')
        setGoogleLoading(false)
        return
      }
      setProfile(data.user)
      navigate(DASHBOARD_BY_ROLE[data.user.role] || '/', { replace: true })
    } catch (err) {
      const msg = googleFriendlyMessage(err)
      if (msg !== null) setInfo(msg)
      if (auth.currentUser && err.code) {
        await signOut(auth)
      }
      setGoogleLoading(false)
    }
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

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-dark" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-bg text-text-muted">OR</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-2.5 text-sm font-medium rounded-full border border-border-dark bg-white hover:bg-neutral-50 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {googleLoading ? (
            <span className="w-4 h-4 border-2 border-text-light border-t-transparent rounded-full animate-spin" />
          ) : (
            <GoogleIcon className="w-5 h-5" />
          )}
          Continue with Google
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
