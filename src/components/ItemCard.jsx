import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import ItemVisual from './ItemVisual'
import { StatusBadge, TypeBadge } from './Badges'
import { timeAgo, formatDate } from '../lib/utils'

export default function ItemCard({ item, action }) {
  return (
    <Link
      to={`/items/${item.id}`}
      className="group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-moss/30 hover:shadow-[0_24px_50px_-30px_rgba(24,33,28,0.5)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <ItemVisual
          item={item}
          className="transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3">
          <TypeBadge type={item.type} />
        </div>
        {item.status !== 'open' && (
          <div className="absolute right-3 top-3">
            <StatusBadge status={item.status} className="bg-paper/90 backdrop-blur" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
          <span>{item.category}</span>
          <span className="h-1 w-1 rounded-full bg-ink/20" />
          <span>{timeAgo(item.created_at)}</span>
        </div>
        <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-ink line-clamp-2">
          {item.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink/55 line-clamp-2">
          {item.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/80 pt-3.5 text-xs text-ink/55">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-moss/70" />
            {item.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-moss/70" />
            {item.type === 'lost' ? 'Lost' : 'Found'} {formatDate(item.event_date)}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 font-semibold text-moss opacity-0 transition group-hover:opacity-100">
            View <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
        {action}
      </div>
    </Link>
  )
}
