import { describe, expect, it } from 'vitest'
import {
  DEMO_OTP_CODE,
  DEMO_STUDENT_EMAIL,
  isValidEmail,
  normalizeEmail,
  studentNameFromEmail,
} from './auth-domain'

describe('isValidEmail', () => {
  it('accepts normal email addresses', () => {
    expect(isValidEmail('avery.johnson@gmail.com')).toBe(true)
    expect(isValidEmail('  AVERY@Example.COM ')).toBe(true)
    expect(isValidEmail('adm2026.001@university.edu')).toBe(true)
  })

  it('rejects malformed addresses', () => {
    expect(isValidEmail('avery')).toBe(false)
    expect(isValidEmail('avery@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('two words@example.com')).toBe(false)
    expect(isValidEmail('avery@example')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Avery@Example.com ')).toBe('avery@example.com')
  })
})

describe('studentNameFromEmail', () => {
  it('creates a readable name from the local part', () => {
    expect(studentNameFromEmail('avery.johnson@example.com')).toBe('Avery Johnson')
    expect(studentNameFromEmail('adm-2026_001@example.com')).toBe('Adm 2026 001')
  })
})

describe('demo OTP', () => {
  it('uses a six-digit code', () => {
    expect(DEMO_OTP_CODE).toMatch(/^\d{6}$/)
  })

  it('uses a valid demo email', () => {
    expect(isValidEmail(DEMO_STUDENT_EMAIL)).toBe(true)
  })
})
