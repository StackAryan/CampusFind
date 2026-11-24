export const DEMO_OTP_CODE = '123456'
export const DEMO_STUDENT_EMAIL = 'avery.johnson@example.com'

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

export function isValidEmail(email) {
  const normalized = normalizeEmail(email)
  if (normalized.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
}

export function studentNameFromEmail(email) {
  const localPart = normalizeEmail(email).split('@')[0] ?? ''
  const words = localPart.split(/[._-]+/).filter(Boolean)
  if (!words.length) return 'Student'
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
