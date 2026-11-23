import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import Logo from './Logo'
import { isDemoMode, resetDemoData } from '../lib/api'

const exploreLinks = [
  { to: '/browse', label: 'Browse listings' },
  { to: '/report?type=lost', label: 'Report a lost item' },
  { to: '/report?type=found', label: 'Report a found item' },
  { to: '/matches', label: 'Potential matches' },
  { to: '/dashboard', label: 'My dashboard' },
]

const trustPoints = [
  'Student-only campus board',
  'Admin-verified ownership claims',
  'Photos stored in the cloud',
  'Notifications for every status change',
]

export default function Footer() {
  const year = new Date().getFullYear()

  const handleReset = () => {
    if (
      window.confirm(
        'Reset the local demo data? This restores the seeded reports, claims and demo accounts.',
      )
    ) {
      resetDemoData()
      window.location.assign('/')
    }
  }

  return (
    <footer className="mt-20 bg-ink text-cream/65">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1.2fr]">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/55">
              A smart, admin-verified lost and found board for campus. Report an item, search
              the board, and let the matching engine do the digging.
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {['React', 'Vite', 'Tailwind', 'Supabase', 'Vercel'].map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-cream/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream/50"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/40">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {exploreLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-cream/60 transition hover:text-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/40">
              Built around trust
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {trustPoints.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-cream/60">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-cream/10 pt-6 text-xs text-cream/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} CampusFind. A cloud computing &amp; web development course project.
          </p>
          {isDemoMode && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip bg-cream/10 text-cream/60">Running in demo mode</span>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-full border border-cream/15 px-3 py-1.5 font-semibold text-cream/60 transition hover:border-cream/30 hover:text-cream"
              >
                <RotateCcw className="h-3 w-3" /> Reset demo data
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
