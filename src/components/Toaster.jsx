import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { dismissToast, subscribeToasts } from '../lib/toast'
import { cn } from '../lib/utils'

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-moss',
    bar: 'border-l-moss',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-coral',
    bar: 'border-l-coral',
  },
  info: {
    icon: Info,
    iconClass: 'text-yellow-700',
    bar: 'border-l-gold',
  },
}

export default function Toaster() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const unsubscribe = subscribeToasts(setItems)
    return unsubscribe
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end">
      {items.map((item) => {
        const variant = VARIANTS[item.type] ?? VARIANTS.info
        const Icon = variant.icon
        return (
          <div
            key={item.id}
            role="status"
            className={cn(
              'animate-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line border-l-4 bg-paper px-4 py-3 shadow-xl',
              variant.bar,
            )}
          >
            <Icon className={cn('mt-0.5 h-4.5 w-4.5 shrink-0', variant.iconClass)} />
            <p className="flex-1 text-sm leading-snug text-ink/85">{item.message}</p>
            <button
              onClick={() => dismissToast(item.id)}
              className="rounded-full p-0.5 text-ink/40 transition hover:bg-ink/5 hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
