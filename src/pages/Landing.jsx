import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Camera,
  Check,
  Cloud,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import ItemVisual from '../components/ItemVisual'
import { TypeBadge } from '../components/Badges'
import { useAuth } from '../context/useAuth'

const steps = [
  {
    number: '01',
    title: 'Report it',
    body: 'Lost or found — post the details, date, campus location and an optional photo in under a minute.',
  },
  {
    number: '02',
    title: 'Search & match',
    body: 'Search the board or let the smart score compare category, keywords, location and date for you.',
  },
  {
    number: '03',
    title: 'Claim with proof',
    body: 'Think it is yours? Submit a claim describing details only the real owner would know.',
  },
  {
    number: '04',
    title: 'Get it back',
    body: 'An admin verifies the claim, approves recovery, and the item leaves the active listings.',
  },
]

const features = [
  {
    icon: Search,
    title: 'Smart search',
    body: 'Search names, descriptions and categories, then narrow by campus location and date.',
  },
  {
    icon: Camera,
    title: 'Photo uploads',
    body: 'Attach pictures of the item so other students can recognise it at a glance.',
  },
  {
    icon: Sparkles,
    title: 'Potential matches',
    body: 'A transparent weighted score surfaces lost and found reports that probably belong together.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified claims',
    body: 'Claim details are visible only to the claimant and admins. Fraudulent claims get rejected.',
  },
  {
    icon: Bell,
    title: 'Live notifications',
    body: 'Get notified when a claim is submitted, approved or rejected — no refresh required.',
  },
  {
    icon: BarChart3,
    title: 'Admin oversight',
    body: 'Admins see pending claims, campus-wide statistics, every report and every student account.',
  },
]

const weights = [
  { label: 'Item category', points: 30 },
  { label: 'Shared keywords', points: 35 },
  { label: 'Campus location', points: 20 },
  { label: 'Date proximity', points: 15 },
]

const sampleLost = {
  category: 'Electronics',
  title: 'Black wireless earbuds',
  location: 'Main Library',
}
const sampleFound = {
  category: 'Electronics',
  title: 'Black wireless earphones',
  location: 'Main Library',
}

function ExampleMatchPanel({ compact = false }) {
  return (
    <div className="rounded-[1.75rem] border border-line bg-paper p-4 shadow-[0_28px_60px_-32px_rgba(24,33,28,0.55)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="chip bg-moss-soft text-moss">
          <Sparkles className="h-3 w-3" /> Potential match
        </span>
        <span className="chip bg-gold-soft text-yellow-800">92 / 100</span>
      </div>

      <div className="mt-3.5 space-y-1.5">
        <div className="flex items-center gap-2.5 rounded-xl bg-cream/70 p-2.5">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
            <ItemVisual item={sampleLost} iconClassName="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <TypeBadge type="lost" className="!px-1.5 !py-0 text-[9px]" />
              <span className="truncate text-xs font-semibold">{sampleLost.title}</span>
            </div>
            <p className="truncate text-[10px] text-ink/45">{sampleLost.location} · Tuesday</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-5">
          <span className="h-5 w-px border-l border-dashed border-moss/40" />
          <span className="rounded-full bg-moss px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cream">
            matched
          </span>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl bg-cream/70 p-2.5">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
            <ItemVisual item={sampleFound} iconClassName="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <TypeBadge type="found" className="!px-1.5 !py-0 text-[9px]" />
              <span className="truncate text-xs font-semibold">{sampleFound.title}</span>
            </div>
            <p className="truncate text-[10px] text-ink/45">{sampleFound.location} · Wednesday</p>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-cream px-2 py-1 text-[10px] text-ink/55">
            Same category <span className="font-semibold text-moss">+30</span>
          </span>
          <span className="rounded-full bg-cream px-2 py-1 text-[10px] text-ink/55">
            4 shared keywords <span className="font-semibold text-moss">+27</span>
          </span>
          <span className="rounded-full bg-cream px-2 py-1 text-[10px] text-ink/55">
            Same location <span className="font-semibold text-moss">+20</span>
          </span>
          <span className="rounded-full bg-cream px-2 py-1 text-[10px] text-ink/55">
            1 day apart <span className="font-semibold text-moss">+15</span>
          </span>
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-ink/35">
        The score is a simple weighted formula — no black box, no AI guesswork.
      </p>
    </div>
  )
}

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSearch = (event) => {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/browse?q=${encodeURIComponent(trimmed)}` : '/browse')
  }

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
        <div className="pointer-events-none absolute -right-28 top-10 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-60 h-80 w-80 rounded-full bg-moss/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] font-semibold text-ink/60">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss/50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-moss" />
              </span>
              One board for every lost &amp; found item on campus
            </div>

            <h1 className="mt-5 font-display text-[3.25rem] font-extrabold leading-[0.92] tracking-[-0.035em] sm:text-6xl xl:text-[4.6rem]">
              Lost it?
              <br />
              Found it?
              <br />
              <span className="relative inline-block text-moss">
                Reunite it.
                <svg
                  viewBox="0 0 240 14"
                  className="absolute -bottom-1 left-0 w-full text-gold"
                  aria-hidden="true"
                >
                  <path
                    d="M3 9c52-5 120-6 234-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink/60 sm:text-base">
              A campus-wide lost and found built for students. Report what disappeared,
              post what you picked up, and let a transparent match engine connect the dots.
              Admins verify every claim before handover.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-7 flex max-w-lg items-center gap-1.5 rounded-2xl border border-line bg-paper p-1.5 shadow-[0_14px_30px_-24px_rgba(24,33,28,0.5)] transition focus-within:border-moss/50 focus-within:ring-4 focus-within:ring-moss/10"
            >
              <Search className="ml-2 h-4.5 w-4.5 shrink-0 text-ink/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm outline-none placeholder:text-ink/35"
                placeholder='Search “black earbuds”, “student ID”, “library”…'
                aria-label="Search lost and found items"
              />
              <button type="submit" className="btn-primary shrink-0 !px-4 !py-2.5">
                Search
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-ink/45">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-moss" /> Admin-verified claims
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Cloud className="h-3.5 w-3.5 text-moss" /> Cloud-backed reports
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-moss" /> Verified student emails
              </span>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to={user ? '/browse' : '/login'} className="btn-primary">
                {user ? 'Browse the board' : 'Student login'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={user ? '/report?type=lost' : '/login?tab=admin'}
                className="btn-outline"
              >
                {user ? 'Report a lost item' : 'Admin login'}
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md animate-rise lg:max-w-none">
            <div className="absolute -left-6 top-6 h-36 w-36 rounded-full bg-gold/25 blur-2xl" />
            <div className="absolute -right-4 bottom-0 h-44 w-44 rounded-full bg-moss/15 blur-2xl" />
            <div className="relative -rotate-1">
              <ExampleMatchPanel />
            </div>
            <div className="absolute -right-2 -top-4 rotate-3 rounded-xl border border-line bg-paper px-3 py-2 text-[10px] font-semibold shadow-lg sm:-right-5">
              <span className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-coral" /> Photo reports
              </span>
            </div>
            <div className="absolute -bottom-4 -left-2 -rotate-2 rounded-xl border border-line bg-paper px-3 py-2 text-[10px] font-semibold shadow-lg sm:-left-5">
              <span className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-moss" /> Notified on every change
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-paper/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-4 py-6 sm:px-6 lg:grid-cols-4">
          {[
            ['1 board', 'for lost & found on campus'],
            ['4 signals', 'drive every match score'],
            ['100%', 'of claims admin-reviewed'],
            ['0 cost', 'for students to use'],
          ].map(([value, label]) => (
            <div key={label} className="px-2 py-3 text-center lg:text-left">
              <p className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
                {value}
              </p>
              <p className="mt-0.5 text-[11px] text-ink/45">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-moss">
            How it works
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            From “I lost it” to “I got it back”
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/55">
            No group chats, no notice boards, no waiting for someone to recognise your
            keychain. Just one clear path from report to recovery.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative overflow-hidden rounded-3xl border border-line bg-paper p-5 transition hover:border-moss/30 hover:shadow-[0_20px_40px_-32px_rgba(24,33,28,0.5)]"
            >
              <span className="font-display text-4xl font-extrabold text-moss/15 transition group-hover:text-moss/25">
                {step.number}
              </span>
              <h3 className="mt-2 font-display text-lg font-bold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink/55">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-moss px-6 py-10 text-cream sm:px-10 lg:px-12 lg:py-14">
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[30px] border-cream/5" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="chip bg-cream/15 text-cream">
                <Sparkles className="h-3 w-3" /> The Potential Match Engine
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Every match comes with
                <br className="hidden sm:block" /> a receipt.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/70">
                We do not use a black-box AI model. Four understandable signals combine into
                a 0–100 score, and every point is shown next to the match. You always know
                <em> why</em> two reports were paired.
              </p>

              <div className="mt-7 space-y-3.5">
                {weights.map((weight) => (
                  <div key={weight.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-cream/80">{weight.label}</span>
                      <span className="font-semibold text-gold">{weight.points} pts</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-cream/10">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${weight.points}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[11px] leading-relaxed text-cream/45">
                Reports only surface as matches at 40+ points, and must share a category or at
                least three keywords. Thresholds are documented in the project README.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -rotate-2 rounded-[1.75rem] bg-cream/5" />
              <div className="relative rotate-1">
                <ExampleMatchPanel />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-moss">
              Everything you need
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Built for a real campus
            </h2>
          </div>
          <Link
            to={user ? '/browse' : '/login'}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-moss hover:underline"
          >
            {user ? 'Open the board' : 'Student login'} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-moss-soft text-moss">
                <feature.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink/55">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card flex flex-col justify-between gap-8 p-7 sm:p-9">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral">
                For students
              </p>
              <h2 className="mt-2 max-w-lg font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Privacy-first by design. Claim details never become public.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/55">
                Found-item listings show what matters for recognition. Ownership proofs are
                visible only to the claimant and administrators. RLS policies on Supabase keep
                every other row private at the database level, not just in the UI.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Auth-protected pages', 'Row-level security', 'Admin audit notes', 'Photo uploads'].map(
                (item) => (
                  <span key={item} className="chip bg-cream text-ink/55">
                    <Check className="h-3 w-3 text-moss" /> {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-ink p-7 text-cream sm:p-9">
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-10" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                For administrators
              </p>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
                One queue. Full oversight.
              </h2>
              <ul className="mt-5 space-y-3 text-sm text-cream/65">
                {[
                  'Review every ownership claim with notes',
                  'Approve, reject and auto-close reports',
                  'See campus-wide category analytics',
                  'Manage reports and student accounts',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-gold-soft px-6 py-12 text-center sm:px-10 sm:py-16">
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative mx-auto max-w-2xl">
            <span className="chip bg-paper/80 text-yellow-800">
              <MapPin className="h-3 w-3" /> Your campus, connected
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Somewhere on campus, someone has your thing.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink/60">
              Join the students already turning lost items back into found ones. It takes a
              minute to post, and the matching engine does the rest.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to={user ? '/report' : '/login'} className="btn-primary">
                {user ? 'Report an item' : 'Student login'} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/browse" className="btn-outline bg-paper">
                Browse listings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
