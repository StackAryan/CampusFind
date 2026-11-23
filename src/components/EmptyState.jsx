import { PackageSearch } from 'lucide-react'

export default function EmptyState({ icon: Icon = PackageSearch, title, body, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-moss-soft text-moss">
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold tracking-tight">{title}</h3>
      {body && <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink/55">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
