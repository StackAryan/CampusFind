import { describe, expect, it } from 'vitest'
import {
  contactDisplay,
  contactHref,
  normalizeContact,
} from './contact'

describe('normalizeContact', () => {
  it('accepts formatted phone numbers', () => {
    expect(normalizeContact('phone', ' +91 98765 43210 ')).toEqual({
      valid: true,
      method: 'phone',
      value: '+91 98765 43210',
    })
    expect(normalizeContact('phone', '(98300) 112-23')).toEqual({
      valid: true,
      method: 'phone',
      value: '(98300) 112-23',
    })
  })

  it('rejects empty, malformed and short phone numbers', () => {
    expect(normalizeContact('phone', '').valid).toBe(false)
    expect(normalizeContact('phone', 'call me').valid).toBe(false)
    expect(normalizeContact('phone', '12345').valid).toBe(false)
    expect(normalizeContact('phone', '1'.repeat(16)).valid).toBe(false)
  })

  it('normalizes Instagram handles', () => {
    expect(normalizeContact('instagram', ' @Avery.Johnson ')).toEqual({
      valid: true,
      method: 'instagram',
      value: 'Avery.Johnson',
    })
    expect(normalizeContact('instagram', 'avery_j_26').valid).toBe(true)
  })

  it('rejects invalid Instagram handles', () => {
    expect(normalizeContact('instagram', '').valid).toBe(false)
    expect(normalizeContact('instagram', 'avery johnson').valid).toBe(false)
    expect(normalizeContact('instagram', 'avery!').valid).toBe(false)
    expect(normalizeContact('instagram', '.avery').valid).toBe(false)
    expect(normalizeContact('instagram', 'avery.').valid).toBe(false)
    expect(normalizeContact('instagram', 'avery..johnson').valid).toBe(false)
    expect(normalizeContact('instagram', 'a'.repeat(31)).valid).toBe(false)
  })

  it('rejects unknown methods', () => {
    expect(normalizeContact('email', 'avery@example.com').valid).toBe(false)
  })
})

describe('contact helpers', () => {
  it('formats contact display values', () => {
    expect(contactDisplay('phone', '+91 98765 43210')).toBe('+91 98765 43210')
    expect(contactDisplay('instagram', 'avery.johnson')).toBe('@avery.johnson')
  })

  it('builds call and Instagram links', () => {
    expect(contactHref('phone', '+91 98765 43210')).toBe('tel:+919876543210')
    expect(contactHref('instagram', '@avery.johnson')).toBe(
      'https://instagram.com/avery.johnson',
    )
  })
})
