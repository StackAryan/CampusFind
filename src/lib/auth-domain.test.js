import { describe, expect, it } from 'vitest'
import {
  DEMO_OTP_CODE,
  normalizeEmail,
  isStudentEmail,
  studentNameFromEmail,
} from './auth-domain'

describe('isStudentEmail', () => {
  it('accepts Adamas student Outlook addresses', () => {
    expect(isStudentEmail('avery.johnson@stu.adamasuniversity.ac.in')).toBe(true)
    expect(isStudentEmail('  ADM2026.001@STU.ADAMASUNIVERSITY.AC.IN ')).toBe(true)
  })

  it('rejects other domains and malformed addresses', () => {
    expect(isStudentEmail('avery@gmail.com')).toBe(false)
    expect(isStudentEmail('avery@adamasuniversity.ac.in')).toBe(false)
    expect(isStudentEmail('avery@students.stu.adamasuniversity.ac.in')).toBe(false)
    expect(isStudentEmail('avery@stu.adamasuniversity.ac.in.evil.com')).toBe(false)
    expect(isStudentEmail('@stu.adamasuniversity.ac.in')).toBe(false)
    expect(isStudentEmail('two words@stu.adamasuniversity.ac.in')).toBe(false)
  })
})

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Avery@Stu.AdamasUniversity.ac.in ')).toBe(
      'avery@stu.adamasuniversity.ac.in',
    )
  })
})

describe('studentNameFromEmail', () => {
  it('creates a readable name from the local part', () => {
    expect(studentNameFromEmail('avery.johnson@stu.adamasuniversity.ac.in')).toBe(
      'Avery Johnson',
    )
    expect(studentNameFromEmail('adm-2026_001@stu.adamasuniversity.ac.in')).toBe(
      'Adm 2026 001',
    )
  })
})

describe('demo OTP', () => {
  it('uses a six-digit code', () => {
    expect(DEMO_OTP_CODE).toMatch(/^\d{6}$/)
  })
})
