import { cn } from '../lib/utils'

const TONES = {
  moss: 'bg-moss-soft text-moss',
  coral: 'bg-coral-soft text-coral',
  gold: 'bg-gold-soft text-yellow-700',
  ink: 'bg-ink/8 text-ink/65',
}

export default function StatCard({ icon: Icon, label, value, hint, tone = 'moss' }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink/45">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn('grid h-10 w-10 place-items-center rounded-xl', TONES[tone])}>
            <Icon className="h-5 w-5" strokeWidth={1.9} />
          </span>
        )}
      </div>
    </div>
  )
}
