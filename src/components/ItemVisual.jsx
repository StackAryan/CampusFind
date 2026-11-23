import { useState } from 'react'
import { getCategoryMeta } from '../lib/categories'
import { cn } from '../lib/utils'

export default function ItemVisual({ item, className, iconClassName }) {
  const [broken, setBroken] = useState(false)
  const meta = getCategoryMeta(item?.category)
  const Icon = meta.icon

  if (item?.image_url && !broken) {
    return (
      <img
        src={item.image_url}
        alt={item.title ? `${item.title} photo` : 'Item photo'}
        loading="lazy"
        onError={() => setBroken(true)}
        className={cn('h-full w-full object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-gradient-to-br',
        meta.visual,
        className,
      )}
      role="img"
      aria-label={item?.title ? `${item.title} placeholder` : 'Item placeholder'}
    >
      <Icon
        className={cn('h-14 w-14', meta.iconClass, iconClassName)}
        strokeWidth={1.4}
        aria-hidden="true"
      />
    </div>
  )
}
