export const CONTACT_METHODS = ['phone', 'instagram']

export const CONTACT_META = {
  phone: {
    label: 'Phone',
    fieldLabel: 'Phone number',
    placeholder: '+91 98765 43210',
  },
  instagram: {
    label: 'Instagram',
    fieldLabel: 'Instagram handle',
    placeholder: '@yourhandle',
  },
}

export function normalizeContact(method, rawValue) {
  const value = String(rawValue ?? '').trim()

  if (!CONTACT_METHODS.includes(method)) {
    return { valid: false, method, value: '', error: 'Choose phone or Instagram.' }
  }

  if (!value) {
    return {
      valid: false,
      method,
      value: '',
      error:
        method === 'phone'
          ? 'Add a phone number so an admin can reach you.'
          : 'Add your Instagram handle so an admin can reach you.',
    }
  }

  if (method === 'phone') {
    if (!/^\+?[\d\s().-]+$/.test(value)) {
      return {
        valid: false,
        method,
        value,
        error: 'Use digits, spaces, +, -, or parentheses only.',
      }
    }
    const digits = value.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 15) {
      return {
        valid: false,
        method,
        value,
        error: 'Enter a phone number with 7 to 15 digits.',
      }
    }
    return { valid: true, method: 'phone', value }
  }

  const handle = value.replace(/^@+/, '')
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
    return {
      valid: false,
      method,
      value: handle,
      error: 'Use 1 to 30 letters, numbers, periods, or underscores.',
    }
  }
  if (handle.startsWith('.') || handle.endsWith('.') || handle.includes('..')) {
    return {
      valid: false,
      method,
      value: handle,
      error: 'An Instagram handle cannot start or end with a period.',
    }
  }
  return { valid: true, method: 'instagram', value: handle }
}

export function contactDisplay(method, value) {
  if (!value) return ''
  if (method === 'phone') return String(value)
  return `@${String(value).replace(/^@+/, '')}`
}

export function contactHref(method, value) {
  if (method === 'phone') {
    return `tel:${String(value ?? '').replace(/[^\d+]/g, '')}`
  }
  return `https://instagram.com/${String(value ?? '').replace(/^@+/, '')}`
}
