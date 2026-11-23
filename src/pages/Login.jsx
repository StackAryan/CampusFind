import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import AuthShell from '../components/AuthShell'
import StudentOtpForm from '../components/StudentOtpForm'
import { Spinner } from '../components/Loading'
import { useAuth } from '../context/useAuth'
import { isDemoMode } from '../lib/api'
import { STUDENT_EMAIL_SUFFIX } from '../lib/auth-domain'
import { cn } from '../lib/utils'
import { toast } from '../lib/toast'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedPath = location.state?.from
  const tab = searchParams.get('tab') === 'admin' ? 'admin' : 'student'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    const fallback = user.role === 'admin' ? '/admin' : '/dashboard'
    navigate(requestedPath || fallback, { replace: true })
  }, [user, requestedPath, navigate])

  const setTab = (nextTab) => {
    const params = new URLSearchParams(searchParams)
    if (nextTab === 'admin') params.set('tab', 'admin')
    else params.delete('tab')
    setSearchParams(params, { replace: true })
    setError('')
  }

  const authenticate = async (nextEmail, nextPassword) => {
    setError('')
    setSubmitting(true)
    try {
      await login(nextEmail.trim(), nextPassword, 'admin')
      toast.success('Administrator signed in.')
    } catch (err) {
      setError(err.message || 'Could not sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdminSubmit = (event) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter the administrator email and password.')
      return
    }
    authenticate(email, password)
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with a single-use link sent to your student email, or as an administrator."
      footer={
        tab === 'admin' ? (
          <>Administrator access is restricted to the single approved admin account.</>
        ) : (
          <>
            Student access is limited to{' '}
            <span className="font-semibold text-ink">{STUDENT_EMAIL_SUFFIX}</span> Outlook
            accounts.
          </>
        )
      }
    >
      <div className="grid grid-cols-2 gap-1 rounded-full border border-line bg-cream p-1">
        <button
          type="button"
          onClick={() => setTab('student')}
          aria-pressed={tab === 'student'}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm',
            tab === 'student'
              ? 'bg-ink text-cream shadow-sm'
              : 'text-ink/55 hover:text-ink',
          )}
        >
          <UserRound className="h-4 w-4" /> Student
        </button>
        <button
          type="button"
          onClick={() => setTab('admin')}
          aria-pressed={tab === 'admin'}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm',
            tab === 'admin'
              ? 'bg-ink text-cream shadow-sm'
              : 'text-ink/55 hover:text-ink',
          )}
        >
          <ShieldCheck className="h-4 w-4" /> Administrator
        </button>
      </div>

      <div className="mt-5">
        {tab === 'student' ? (
          <StudentOtpForm />
        ) : (
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight">
              Administrator sign in
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink/50">
              Use the single CampusFind administrator account created in Supabase.
            </p>

            <form onSubmit={handleAdminSubmit} className="mt-4 space-y-4" noValidate>
              <div>
                <label htmlFor="admin-email" className="label">
                  Administrator email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  className="input"
                  placeholder="admin@yourcollege.ac.in"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label htmlFor="admin-password" className="label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="input pr-11"
                    placeholder="Administrator password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={submitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/40 transition hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="flex items-start gap-2 rounded-xl bg-coral-soft px-3.5 py-2.5 text-xs font-medium text-coral">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {submitting ? 'Signing in…' : 'Sign in as administrator'}
              </button>
            </form>

            {isDemoMode && (
              <div className="mt-5 rounded-2xl border border-dashed border-line bg-cream/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
                  Demo administrator
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@campus.edu')
                    setPassword('admin123')
                    authenticate('admin@campus.edu', 'admin123')
                  }}
                  disabled={submitting}
                  className="btn-outline mt-2.5 w-full !py-2 text-xs"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Use admin demo account
                </button>
                <p className="mt-2 text-[11px] text-ink/40">
                  admin@campus.edu / admin123
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthShell>
  )
}
