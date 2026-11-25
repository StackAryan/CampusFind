import { AtSign, Phone } from 'lucide-react'
import { contactDisplay, contactHref } from '../lib/contact'

export default function ContactLink({ contact, showLabel = true, className = '' }) {
  if (!contact?.contact_method || !contact?.contact_value) return null

  const isPhone = contact.contact_method === 'phone'
  const Icon = isPhone ? Phone : AtSign

  return (
    <a
      href={contactHref(contact.contact_method, contact.contact_value)}
      target={isPhone ? undefined : '_blank'}
      rel={isPhone ? undefined : 'noreferrer'}
      className={`inline-flex items-center gap-1.5 text-xs text-ink/60 transition hover:text-moss ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-moss" />
      {showLabel && (
        <span className="text-ink/35">{isPhone ? 'Phone' : 'Instagram'}:</span>
      )}
      <span className="font-semibold">
        {contactDisplay(contact.contact_method, contact.contact_value)}
      </span>
    </a>
  )
}
