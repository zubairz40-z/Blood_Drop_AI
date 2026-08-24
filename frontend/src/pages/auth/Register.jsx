import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, User, Phone, Heart, UserCheck, Building2, HandHelping } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import PasswordField from '../../components/auth/PasswordField'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../../config/firebase'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const roles = [
  { value: 'Donor', label: 'Donor', description: 'Help respond to blood donation needs.', icon: Heart },
  { value: 'Patient', label: 'Patient', description: 'Create and track blood requests.', icon: UserCheck },
  { value: 'Hospital', label: 'Hospital', description: 'Coordinate requests and donation confirmation.', icon: Building2 },
  { value: 'Volunteer', label: 'Volunteer', description: 'Support emergency donation coordination.', icon: HandHelping },
]

function Register() {
  const navigate = useNavigate()
  const { setProfile } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) {
      errs.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email'
    }
    if (!form.phone.trim()) {
      errs.phone = 'Phone is required'
    } else if (form.phone.replace(/\D/g, '').length < 7) {
      errs.phone = 'Please enter a valid phone number'
    }
    if (!form.password) {
      errs.password = 'Password is required'
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters'
    }
    if (!form.role) errs.role = 'Please select a role'
    return errs
  }

    const DASHBOARD_BY_ROLE = {
    patient: '/patient',
    donor: '/donor',
    hospital: '/hospital',
    volunteer: '/volunteer',
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

    const role = form.role.toLowerCase()

    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password)

      const { data } = await api.post('/api/auth/register', {
        name: form.name,
        role,
        phone: form.phone,
      })

      // Hospitals need admin approval before they can sign in
      if (data.user.accountStatus === 'pending') {
        await signOut(auth)
        setLoading(false)
        setInfo('Account created. A hospital account needs admin approval before you can sign in.')
        return
      }

      setProfile(data.user)
      navigate(DASHBOARD_BY_ROLE[role] || '/', { replace: true })
    } catch (err) {
      if (auth.currentUser && !err.code) {
        await signOut(auth)
      }
      setInfo(registerErrorMessage(err))
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
        <h1 className="text-2xl font-bold text-text-dark mb-1">Create your account</h1>
        <p className="text-sm text-text-muted mb-6">Join BloodDrop AI and be part of the coordination network.</p>

        {info && (
          <Alert variant="info" className="mb-6">
            {info}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Name"
            name="name"
            icon={User}
            value={form.name}
            onChange={handleChange('name')}
            placeholder="Enter your full name"
            error={errors.name}
            required
            autoComplete="name"
          />

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

          <Input
            label="Phone"
            name="phone"
            type="tel"
            icon={Phone}
            value={form.phone}
            onChange={handleChange('phone')}
            placeholder="+880 1XXXXXXXXX"
            error={errors.phone}
            required
            autoComplete="tel"
          />

          <PasswordField
            name="password"
            value={form.password}
            onChange={handleChange('password')}
            placeholder="At least 6 characters"
            error={errors.password}
            required
            autoComplete="new-password"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-charcoal">
              Role<span className="text-blood ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, role: r.value }))
                    if (errors.role) setErrors((prev) => ({ ...prev, role: '' }))
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                    form.role === r.value
                      ? 'border-brand bg-brand-soft/50 ring-2 ring-brand/20'
                      : 'border-border-dark hover:border-brand/50 bg-white'
                  }`}
                  aria-pressed={form.role === r.value}
                >
                  <div className="mb-1.5"><r.icon className="w-5 h-5 text-text-secondary" /></div>
                  <div className="text-sm font-semibold text-text-dark">{r.label}</div>
                  <div className="text-[11px] text-text-muted leading-snug mt-0.5">{r.description}</div>
                </button>
              ))}
            </div>
            {errors.role && (
              <p className="text-xs text-blood" role="alert">{errors.role}</p>
            )}
          </div>

          <Button type="submit" loading={loading} className="w-full mt-2">
            Create Account
          </Button>
        </form>

        <p className="text-sm text-text-muted text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand hover:text-brand-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

function registerErrorMessage(err) {
  switch (err.code) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.'
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-up is not enabled in Firebase.'
    default:
      return err.response?.data?.message || err.message || 'Could not create your account.'
  }
}

export default Register
