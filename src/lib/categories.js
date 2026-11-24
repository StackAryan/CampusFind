import {
  Backpack,
  BookOpen,
  Droplets,
  Dumbbell,
  Gem,
  Headphones,
  IdCard,
  KeyRound,
  Package,
  Shirt,
  Wallet,
} from 'lucide-react'

export const CATEGORIES = [
  {
    value: 'Electronics',
    icon: Headphones,
    visual: 'from-cyan-100 via-sky-100 to-teal-200',
    iconClass: 'text-teal-700/60',
  },
  {
    value: 'ID & Cards',
    icon: IdCard,
    visual: 'from-amber-100 via-orange-100 to-amber-200',
    iconClass: 'text-amber-700/60',
  },
  {
    value: 'Keys',
    icon: KeyRound,
    visual: 'from-stone-100 via-slate-100 to-stone-200',
    iconClass: 'text-stone-600/60',
  },
  {
    value: 'Wallets & Purses',
    icon: Wallet,
    visual: 'from-orange-100 via-amber-100 to-rose-200',
    iconClass: 'text-orange-700/60',
  },
  {
    value: 'Bags & Backpacks',
    icon: Backpack,
    visual: 'from-lime-100 via-emerald-100 to-teal-200',
    iconClass: 'text-emerald-700/60',
  },
  {
    value: 'Books & Notes',
    icon: BookOpen,
    visual: 'from-blue-100 via-indigo-100 to-blue-200',
    iconClass: 'text-blue-700/60',
  },
  {
    value: 'Clothing',
    icon: Shirt,
    visual: 'from-rose-100 via-pink-100 to-rose-200',
    iconClass: 'text-rose-700/60',
  },
  {
    value: 'Jewelry & Accessories',
    icon: Gem,
    visual: 'from-violet-100 via-purple-100 to-fuchsia-200',
    iconClass: 'text-violet-700/60',
  },
  {
    value: 'Bottles',
    icon: Droplets,
    visual: 'from-cyan-100 via-blue-100 to-cyan-200',
    iconClass: 'text-cyan-700/60',
  },
  {
    value: 'Sports Gear',
    icon: Dumbbell,
    visual: 'from-lime-100 via-green-100 to-emerald-200',
    iconClass: 'text-green-700/60',
  },
  {
    value: 'Other',
    icon: Package,
    visual: 'from-neutral-100 via-stone-100 to-neutral-200',
    iconClass: 'text-neutral-600/60',
  },
]

export const CATEGORY_VALUES = CATEGORIES.map((category) => category.value)

export function getCategoryMeta(value) {
  return CATEGORIES.find((category) => category.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
}

export const LOCATIONS = [
  'AU - 6 SOET',
  'CONVENTION CENTRE',
  'AU - 1',
  'AU - 2',
  'AU - 3',
  'AU - 4',
  'AU - 5',
  'ADMIN BUILDING',
  'ADMISSION/GYM BLOCK',
  'AKC FOOD COURT',
  'BOYS HOSTEL 1',
  'BOYS HOSTEL 2',
  'GIRLS HOSTEL 1',
  'INTERNATIONAL GIRLS HOSTEL',
  'GIRLS HOSTEL 4',
  'PHARMACY',
  'ADAMAS WORLD SCHOOL',
  'ADAMAS BUS STAND',
  'SOET GROUND',
  'PANDA JUNCTION',
  'CENTRAL LIBRARY',
]

export const TYPE_META = {
  lost: {
    label: 'Lost',
    badge: 'bg-coral-soft text-coral',
    dot: 'bg-coral',
    action: 'Report a lost item',
  },
  found: {
    label: 'Found',
    badge: 'bg-moss-soft text-moss',
    dot: 'bg-moss',
    action: 'Report a found item',
  },
}

export const STATUS_META = {
  open: {
    label: 'Open',
    badge: 'bg-moss-soft text-moss',
  },
  in_review: {
    label: 'Claim pending',
    badge: 'bg-gold-soft text-yellow-800',
  },
  resolved: {
    label: 'Recovered',
    badge: 'bg-ink/8 text-ink/60',
  },
}

export const CLAIM_STATUS_META = {
  pending: {
    label: 'Pending review',
    badge: 'bg-gold-soft text-yellow-800',
  },
  approved: {
    label: 'Approved',
    badge: 'bg-moss-soft text-moss',
  },
  rejected: {
    label: 'Not approved',
    badge: 'bg-coral-soft text-coral',
  },
}
