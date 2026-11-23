import { Link } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Logo({ compact = false, dark = false }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="CampusFind home">
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition duration-300 group-hover:-rotate-6',
          dark ? 'bg-cream text-moss' : 'bg-moss text-cream',
        )}
      >
        <PackageSearch className="h-5 w-5" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span
            className={cn(
              'font-display text-xl font-extrabold tracking-tight',
              dark ? 'text-cream' : 'text-ink',
            )}
          >
            Campus<span className="text-gold">Find</span>
          </span>
          <span
            className={cn(
              'mt-1 block text-[9px] font-semibold uppercase tracking-[0.2em]',
              dark ? 'text-cream/55' : 'text-ink/45',
            )}
          >
            Campus lost &amp; found
          </span>
        </span>
      )}
    </Link>
  )
}
