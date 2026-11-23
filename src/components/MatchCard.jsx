import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import ItemVisual from './ItemVisual'
import { TypeBadge } from './Badges'
import { formatDate } from '../lib/utils'
import { matchTier } from '../lib/matching'

export default function MatchCard({ match, compact = false, newTab = false }) {
  const { item, score, reasons } = match
  const tier = matchTier(score)
  const visibleReasons = reasons.slice(0, compact ? 2 : 4)

  return (
    <Link
      to={`/items/${item.id}`}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noreferrer' : undefined}
      className="group block rounded-2xl border border-line bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-moss/35 hover:shadow-[0_16px_30px_-24px_rgba(24,33,28,0.6)]"
    >
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
          <ItemVisual item={item} iconClassName="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={item.type} className="!px-2 !py-0.5" />
            <span className={`chip ${tier.bg} ${tier.text} !px-2 !py-0.5`}>{tier.label}</span>
          </div>
          <h4 className="mt-1.5 truncate font-semibold leading-snug text-ink">{item.title}</h4>
          <p className="truncate text-xs text-ink/50">
            {item.location} · {formatDate(item.event_date)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-display text-2xl font-extrabold leading-none ${tier.text}`}>{score}</p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink/35">
            / 100
          </p>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sand/80">
        <div
          className={`h-full rounded-full ${tier.bar} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      {visibleReasons.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {visibleReasons.map((reason) => (
            <span
              key={`${reason.label}-${reason.points}`}
              className="rounded-full bg-cream px-2.5 py-1 text-[11px] leading-tight text-ink/60"
            >
              {reason.label}{' '}
              <span className="font-semibold text-moss">+{reason.points}</span>
            </span>
          ))}
        </div>
      )}

      <p className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-moss opacity-70 transition group-hover:opacity-100">
        View listing <ArrowUpRight className="h-3 w-3" />
      </p>
    </Link>
  )
}
