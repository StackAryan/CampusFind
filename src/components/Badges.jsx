import { CLAIM_STATUS_META, STATUS_META, TYPE_META } from '../lib/categories'
import { cn } from '../lib/utils'

export function TypeBadge({ type, className }) {
  const meta = TYPE_META[type]
  if (!meta) return null
  return (
    <span className={cn('chip shadow-sm backdrop-blur', meta.badge, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}

export function StatusBadge({ status, className }) {
  const meta = STATUS_META[status]
  if (!meta) return null
  return <span className={cn('chip', meta.badge, className)}>{meta.label}</span>
}

export function ClaimStatusBadge({ status, className }) {
  const meta = CLAIM_STATUS_META[status]
  if (!meta) return null
  return <span className={cn('chip', meta.badge, className)}>{meta.label}</span>
}
