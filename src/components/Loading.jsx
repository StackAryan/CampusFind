import { Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin', className)} aria-hidden="true" />
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-28 text-ink/50">
      <Spinner className="h-7 w-7 text-moss" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="aspect-[4/3] bg-sand/60" />
      <div className="space-y-3 p-5">
        <div className="h-2.5 w-1/3 rounded-full bg-sand" />
        <div className="h-4 w-4/5 rounded-full bg-sand" />
        <div className="h-3 w-full rounded-full bg-sand/70" />
        <div className="h-3 w-2/3 rounded-full bg-sand/70" />
      </div>
    </div>
  )
}

export function ItemGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  )
}
