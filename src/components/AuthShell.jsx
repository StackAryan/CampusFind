import { Link } from 'react-router-dom'
import { MailCheck, ShieldCheck, Sparkles } from 'lucide-react'

const points = [
  {
    icon: MailCheck,
    title: 'Verified email login',
    body: 'Any email address can request a single-use sign-in link.',
  },
  {
    icon: Sparkles,
    title: 'See possible matches instantly',
    body: 'A transparent score compares category, keywords, location and date.',
  },
  {
    icon: ShieldCheck,
    title: 'Claims are verified by admins',
    body: 'Ownership claims are reviewed before an item is handed over.',
  },
]

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-16">
      <div className="hidden lg:block">
        <Link
          to="/"
          className="chip bg-moss-soft text-moss"
        >
          CampusFind · verified email access
        </Link>
        <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.02] tracking-tight xl:text-5xl">
          The campus board that
          <span className="relative mx-2 inline-block">
            <span className="relative z-10">gets it back</span>
            <span className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 bg-gold/40" />
          </span>
          to you.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/55">
          One shared place for lost and found reports, with smart matching,
          admin-verified claims and one-time sign-in links sent to your email.
        </p>

        <ul className="mt-8 space-y-4">
          {points.map((point) => (
            <li key={point.title} className="flex gap-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-paper text-moss ring-1 ring-line">
                <point.icon className="h-4.5 w-4.5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-sm font-semibold">{point.title}</p>
                <p className="mt-0.5 max-w-sm text-xs leading-relaxed text-ink/50">{point.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-9 inline-flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-soft font-display text-sm font-extrabold text-yellow-800">
            92
          </span>
          <p className="text-xs leading-snug text-ink/55">
            <span className="font-semibold text-ink">Potential match found</span>
            <br />
            Black earbuds · CENTRAL LIBRARY · 1 day apart
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1.5 text-sm text-ink/55">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-ink/55">{footer}</div>}
      </div>
    </div>
  )
}
