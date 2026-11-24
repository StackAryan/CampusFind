import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  MailCheck,
  RotateCw,
  ShieldCheck,
} from 'lucide-react'
import { Spinner } from './Loading'
import { useAuth } from '../context/useAuth'
import { isDemoMode, requestStudentOtp } from '../lib/api'
import {
  DEMO_OTP_CODE,
  DEMO_STUDENT_EMAIL,
  isValidEmail,
  normalizeEmail,
} from '../lib/auth-domain'
import { toast } from '../lib/toast'
import { cn } from '../lib/utils'

export default function StudentOtpForm() {
  const { loginWithOtp } = useAuth()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [showCode, setShowCode] = useState(false)
  const codeRef = useRef(null)

  useEffect(() => {
    if (step === 'code' || (step === 'link' && showCode)) codeRef.current?.focus()
  }, [step, showCode])

  useEffect(() => {
    if (!window.location.hash.includes('error=')) return
    const params = new URLSearchParams(window.location.hash.slice(1))
    if (!params.get('error') && !params.get('error_description')) return
    setError('That sign-in link is invalid or has expired. Request a new link below.')
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}`,
    )
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const sendCode = async (event) => {
    event?.preventDefault()
    setError('')
    setNotice('')
    const normalized = normalizeEmail(email)
    if (!isValidEmail(normalized)) {
      setError('Enter a valid email address.')
      return
    }

    setSending(true)
    try {
      const result = await requestStudentOtp(normalized)
      setEmail(normalized)
      setCooldown(45)
      if (result?.demoCode) {
        setStep('code')
        setCode(result.demoCode)
        setNotice(`Demo mode: no email was sent. Use code ${result.demoCode}.`)
        toast.success('Demo verification code is ready.')
      } else {
        setStep('link')
        setCode('')
        setNotice('')
        toast.success('Sign-in link sent. Check your inbox.')
      }
    } catch (err) {
      setError(
        err.message ||
          (isDemoMode
            ? 'The code could not be sent. Please try again.'
            : 'The sign-in link could not be sent. Please try again.'),
      )
    } finally {
      setSending(false)
    }
  }

  const verify = async (event) => {
    event.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setVerifying(true)
    try {
      await loginWithOtp(email, code.trim())
      toast.success('Email verified. Welcome to CampusFind.')
    } catch (err) {
      setError(err.message || 'The code could not be verified. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const restart = () => {
    setStep('email')
    setCode('')
    setError('')
    setNotice('')
    setCooldown(0)
    setShowCode(false)
  }

  if (step === 'link') {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-moss-soft/60 px-3.5 py-3">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">
              Link sent to
            </p>
            <p className="truncate text-xs font-semibold text-ink/75">{email}</p>
          </div>
          <button
            type="button"
            onClick={restart}
            className="ml-auto shrink-0 text-[11px] font-semibold text-moss hover:underline"
          >
            Change
          </button>
        </div>

        <div className="rounded-2xl border border-moss/15 bg-moss-soft/40 px-4 py-5 text-center">
          <MailCheck className="mx-auto h-7 w-7 text-moss" />
          <h3 className="mt-2 font-display text-lg font-bold tracking-tight">
            Check your email
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-ink/60">
            We sent a single-use sign-in link to{' '}
            <span className="font-semibold text-ink/75">{email}</span>. Open it on this
            device to finish signing in.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-ink/40">
            The link expires shortly. If it has not arrived, check your spam or junk
            folder.
          </p>
        </div>

        {error && (
          <p className="flex items-start gap-2 rounded-xl bg-coral-soft px-3.5 py-2.5 text-xs font-medium text-coral">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 text-[11px]">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-1 font-semibold text-ink/45 transition hover:text-ink"
          >
            <ArrowLeft className="h-3 w-3" /> Different email
          </button>
          <button
            type="button"
            onClick={sendCode}
            disabled={sending || cooldown > 0}
            className="inline-flex items-center gap-1 font-semibold text-moss transition hover:underline disabled:cursor-not-allowed disabled:text-ink/30 disabled:no-underline"
          >
            {sending ? (
              <Spinner className="h-3 w-3" />
            ) : (
              <RotateCw className="h-3 w-3" />
            )}
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
          </button>
        </div>

        <div className="border-t border-line pt-3">
          <button
            type="button"
            onClick={() => setShowCode((current) => !current)}
            aria-expanded={showCode}
            className="mx-auto flex items-center gap-1 text-[11px] font-semibold text-ink/45 transition hover:text-ink"
          >
            Have a 6-digit code?
            <ChevronDown
              className={cn('h-3 w-3 transition', showCode && 'rotate-180')}
            />
          </button>

          {showCode && (
            <form onSubmit={verify} className="mt-3 space-y-3" noValidate>
              <div>
                <label htmlFor="student-otp" className="label">
                  6-digit verification code
                </label>
                <input
                  ref={codeRef}
                  id="student-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="input text-center font-display text-2xl font-bold tracking-[0.45em]"
                  placeholder="000000"
                  disabled={verifying}
                />
                <p className="mt-1.5 text-[11px] text-ink/40">
                  Only if your email includes a six-digit code. Never share it with
                  anyone.
                </p>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={verifying || code.length !== 6}
              >
                {verifying ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {verifying ? 'Verifying…' : 'Verify & continue'}
              </button>
            </form>
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[10px] text-ink/35">
          <ShieldCheck className="h-3 w-3" /> Passwordless. The link works only once.
        </p>
      </div>
    )
  }

  if (step === 'code') {
    return (
      <form onSubmit={verify} className="space-y-4" noValidate>
        <div className="flex items-start gap-3 rounded-xl bg-moss-soft/60 px-3.5 py-3">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">
              Code sent to
            </p>
            <p className="truncate text-xs font-semibold text-ink/75">{email}</p>
          </div>
          <button
            type="button"
            onClick={restart}
            className="ml-auto shrink-0 text-[11px] font-semibold text-moss hover:underline"
          >
            Change
          </button>
        </div>

        {notice && (
          <div className="flex items-start gap-2 rounded-xl bg-gold-soft/70 px-3.5 py-2.5 text-[11px] leading-relaxed text-yellow-900">
            <MailCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {notice}
          </div>
        )}

        <div>
          <label htmlFor="student-otp" className="label">
            6-digit verification code
          </label>
          <input
            ref={codeRef}
            id="student-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="input text-center font-display text-2xl font-bold tracking-[0.45em]"
            placeholder="000000"
            disabled={verifying}
          />
          <p className="mt-1.5 text-[11px] text-ink/40">
            The code expires shortly. Never share it with anyone.
          </p>
        </div>

        {error && (
          <p className="flex items-start gap-2 rounded-xl bg-coral-soft px-3.5 py-2.5 text-xs font-medium text-coral">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={verifying || code.length !== 6}
        >
          {verifying ? <Spinner className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {verifying ? 'Verifying…' : 'Verify & continue'}
        </button>

        <div className="flex items-center justify-between gap-2 text-[11px]">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-1 font-semibold text-ink/45 transition hover:text-ink"
          >
            <ArrowLeft className="h-3 w-3" /> Different email
          </button>
          <button
            type="button"
            onClick={sendCode}
            disabled={sending || cooldown > 0}
            className="inline-flex items-center gap-1 font-semibold text-moss transition hover:underline disabled:cursor-not-allowed disabled:text-ink/30 disabled:no-underline"
          >
            {sending ? (
              <Spinner className="h-3 w-3" />
            ) : (
              <RotateCw className="h-3 w-3" />
            )}
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={sendCode} className="space-y-4" noValidate>
      <div>
        <label htmlFor="student-email" className="label">
          Email address
        </label>
        <div className="relative">
          <MailCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            id="student-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className="input pl-10"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={sending}
            required
          />
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink/40">
          Use any email address you can access. We send a sign-in link to confirm it is
          yours.
        </p>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-xl bg-coral-soft px-3.5 py-2.5 text-xs font-medium text-coral">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {isDemoMode && (
        <div className="rounded-xl border border-dashed border-line bg-gold-soft/50 px-3.5 py-2.5 text-[11px] leading-relaxed text-yellow-900">
          <span className="font-semibold">Demo mode:</span> no email is sent. Request a
          code, then use <span className="font-bold">{DEMO_OTP_CODE}</span>. The seeded
          student is <span className="font-semibold">{DEMO_STUDENT_EMAIL}</span>.
        </div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={sending}>
        {sending ? <Spinner className="h-4 w-4" /> : <MailCheck className="h-4 w-4" />}
        {sending
          ? isDemoMode
            ? 'Sending code…'
            : 'Sending link…'
          : isDemoMode
            ? 'Send verification code'
            : 'Email me a sign-in link'}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[10px] text-ink/35">
        <ShieldCheck className="h-3 w-3" /> Passwordless.{' '}
        {isDemoMode
          ? 'Demo mode uses a fixed one-time code.'
          : 'We email a single-use sign-in link.'}
      </p>
    </form>
  )
}
