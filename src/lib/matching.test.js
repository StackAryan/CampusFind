import { describe, expect, it } from 'vitest'
import {
  MATCH_WEIGHTS,
  extractKeywords,
  findMatches,
  getMatchScore,
  matchTier,
} from './matching'

function lost(overrides = {}) {
  return {
    id: 'lost-1',
    user_id: 'student-a',
    type: 'lost',
    title: 'Black wireless earbuds',
    description: 'Lost my black earbuds in a white case near the library entrance.',
    category: 'Electronics',
    location: 'Main Library',
    event_date: '2026-11-20',
    status: 'open',
    ...overrides,
  }
}

function found(overrides = {}) {
  return {
    id: 'found-1',
    user_id: 'student-b',
    type: 'found',
    title: 'Black wireless earphones',
    description: 'Found black earphones in a white case outside the library.',
    category: 'Electronics',
    location: 'Main Library',
    event_date: '2026-11-21',
    status: 'open',
    ...overrides,
  }
}

describe('extractKeywords', () => {
  it('ignores filler words and reports', () => {
    const words = extractKeywords('Lost the item near the library')
    expect(words.has('library')).toBe(true)
    expect(words.has('lost')).toBe(false)
    expect(words.has('the')).toBe(false)
    expect(words.has('near')).toBe(false)
  })
})

describe('getMatchScore', () => {
  it('scores a strong earbuds pair and explains every point', () => {
    const match = getMatchScore(lost(), found())
    expect(match).not.toBeNull()
    expect(match.score).toBeGreaterThanOrEqual(85)
    expect(match.categoryMatch).toBe(true)
    expect(match.sharedKeywords).toContain('black')
    expect(match.sharedKeywords).toContain('library')

    const reasonTotal = match.reasons.reduce((sum, reason) => sum + reason.points, 0)
    expect(reasonTotal).toBe(match.score)
  })

  it('never awards more than the configured weights', () => {
    const match = getMatchScore(lost(), found())
    const maxScore = Object.values(MATCH_WEIGHTS).reduce((sum, points) => sum + points, 0)
    expect(match.score).toBeLessThanOrEqual(maxScore)
  })

  it('returns null for two reports of the same type', () => {
    expect(getMatchScore(lost(), lost({ id: 'lost-2' }))).toBeNull()
  })

  it('returns null for the exact same report', () => {
    const item = lost()
    expect(getMatchScore(item, item)).toBeNull()
  })

  it('gives no points when category, location, date and keywords differ', () => {
    const match = getMatchScore(
      lost(),
      found({
        title: 'Blue umbrella',
        description: 'Found a compact blue umbrella inside the gym.',
        category: 'Other',
        location: 'Sports Complex',
        event_date: '2026-09-01',
      }),
    )
    expect(match.score).toBe(0)
    expect(match.reasons).toHaveLength(0)
  })
})

describe('findMatches', () => {
  it('returns qualifying matches sorted by score', () => {
    const allItems = [
      found(),
      found({
        id: 'found-2',
        title: 'Student ID card',
        description: 'Found a student ID card in the library.',
        category: 'ID & Cards',
        event_date: '2026-11-19',
      }),
    ]
    const matches = findMatches(lost(), allItems)
    expect(matches).toHaveLength(1)
    expect(matches[0].item.id).toBe('found-1')
  })

  it('excludes resolved listings, same-type reports and the same owner', () => {
    const allItems = [
      found({ status: 'resolved' }),
      found({ id: 'found-4', user_id: 'student-a' }),
      lost({ id: 'lost-2' }),
    ]
    expect(findMatches(lost(), allItems)).toHaveLength(0)
  })

  it('excludes weak cross-category pairs with only two shared keywords', () => {
    const allItems = [
      found({
        title: 'Blue Hydro Flask',
        description: 'Found a blue bottle with stickers at the sports complex.',
        category: 'Bottles',
        location: 'Sports Complex',
        event_date: '2026-11-19',
      }),
    ]
    const hoodie = lost({
      title: 'Charcoal hoodie',
      description: 'Lost a grey hoodie at the sports complex near the courts.',
      category: 'Clothing',
      location: 'Sports Complex',
      event_date: '2026-11-18',
    })
    expect(findMatches(hoodie, allItems)).toHaveLength(0)
  })

  it('respects the score threshold', () => {
    const allItems = [
      found({
        title: 'USB-C charging cable',
        description: 'Found a braided cable in the science labs.',
        category: 'Electronics',
        location: 'Science Labs',
        event_date: '2026-08-01',
      }),
    ]
    expect(findMatches(lost(), allItems)).toHaveLength(0)
    expect(findMatches(lost(), allItems, { minScore: 30 })).toHaveLength(1)
  })
})

describe('matchTier', () => {
  it('labels scores consistently', () => {
    expect(matchTier(80).label).toBe('Strong match')
    expect(matchTier(60).label).toBe('Possible match')
    expect(matchTier(45).label).toBe('Worth checking')
  })
})
