export const STUDENT_EMAIL_DOMAIN = 'stu.adamasuniversity.ac.in'
export const STUDENT_EMAIL_SUFFIX = `@${STUDENT_EMAIL_DOMAIN}`
export const UNIVERSITY_PORTAL_URL = 'https://adamasknowledgecity.ac.in/student/login'
export const DEMO_OTP_CODE = '123456'

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

export function isStudentEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized.endsWith(STUDENT_EMAIL_SUFFIX)) return false
  const localPart = normalized.slice(0, -STUDENT_EMAIL_SUFFIX.length)
  return localPart.length > 0 && !localPart.includes('@') && !/\s/.test(localPart)
}

export function studentNameFromEmail(email) {
  const localPart = normalizeEmail(email).split('@')[0] ?? ''
  const words = localPart.split(/[._-]+/).filter(Boolean)
  if (!words.length) return 'Student'
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
