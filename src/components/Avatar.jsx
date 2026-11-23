import { initials } from '../lib/utils'

const SIZES = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
}

export default function Avatar({ name = '', size = 'md', className = '' }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-moss-soft font-bold text-moss ${SIZES[size] ?? SIZES.md} ${className}`}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </span>
  )
}
