const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'near', 'from', 'this', 'that', 'these', 'those',
  'have', 'has', 'had', 'found', 'lost', 'left', 'about', 'into', 'over', 'under',
  'some', 'when', 'where', 'were', 'was', 'are', 'its', 'of', 'in', 'on', 'at',
  'to', 'my', 'me', 'is', 'it', 'a', 'an', 'by', 'or', 'as', 'be', 'not', 'but',
  'item', 'items', 'campus', 'someone', 'please', 'if', 'anyone', 'knows', 'think',
  'very', 'just', 'also', 'there', 'their', 'they', 'them', 'can', 'could', 'would',
  'should', 'been', 'being', 'while', 'during', 'after', 'before', 'between', 'up',
  'down', 'out', 'off', 'around', 'inside', 'outside', 'back', 'still', 'only',
])

export const MATCH_WEIGHTS = {
  category: 30,
  keywords: 35,
  location: 20,
  date: 15,
}

export const MATCH_THRESHOLD = 40

function normalize(value = '') {
  return String(value).trim().toLowerCase()
}

export function extractKeywords(...values) {
  const tokens = new Set()
  for (const value of values) {
    const text = normalize(value)
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
    for (const token of text) {
      if (token.length >= 3 && !STOP_WORDS.has(token)) {
        tokens.add(token)
      }
    }
  }
  return tokens
}

function scoreCategory(a, b) {
  if (!a.category || !b.category) return { points: 0 }
  if (normalize(a.category) === normalize(b.category)) {
    return { points: MATCH_WEIGHTS.category, label: `Same category (${a.category})` }
  }
  return { points: 0 }
}

function scoreKeywords(a, b) {
  const aWords = extractKeywords(a.title, a.description)
  const bWords = extractKeywords(b.title, b.description)
  if (!aWords.size || !bWords.size) return { points: 0, shared: [] }

  const shared = [...aWords].filter((word) => bWords.has(word))
  if (!shared.length) return { points: 0, shared: [] }

  const ratio = shared.length / Math.min(aWords.size, bWords.size)
  const points = Math.round(MATCH_WEIGHTS.keywords * ratio)
  return { points, shared: shared.slice(0, 6) }
}

function scoreLocation(a, b) {
  const locationA = normalize(a.location)
  const locationB = normalize(b.location)
  if (!locationA || !locationB) return { points: 0 }

  if (locationA === locationB) {
    return { points: MATCH_WEIGHTS.location, label: `Same location (${a.location})` }
  }
  if (locationA.includes(locationB) || locationB.includes(locationA)) {
    return { points: 14, label: 'Similar campus location' }
  }

  const wordsA = extractKeywords(a.location)
  const wordsB = extractKeywords(b.location)
  const shared = [...wordsA].filter((word) => wordsB.has(word))
  if (shared.length) {
    return { points: 10, label: `Nearby location (${shared[0]})` }
  }
  return { points: 0 }
}

function scoreDate(a, b) {
  if (!a.event_date || !b.event_date) return { points: 0 }
  const dateA = new Date(`${a.event_date}T00:00:00`)
  const dateB = new Date(`${b.event_date}T00:00:00`)
  if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) return { points: 0 }

  const days = Math.round(Math.abs(dateA - dateB) / 86_400_000)
  if (days <= 1) return { points: MATCH_WEIGHTS.date, label: days === 0 ? 'Reported on the same day' : 'Reported 1 day apart' }
  if (days <= 3) return { points: 12, label: `Reported ${days} days apart` }
  if (days <= 7) return { points: 8, label: `Reported ${days} days apart` }
  if (days <= 14) return { points: 4, label: `Reported ${days} days apart` }
  return { points: 0 }
}

export function getMatchScore(itemA, itemB) {
  if (!itemA || !itemB) return null
  if (itemA.type === itemB.type) return null
  if (itemA.id && itemB.id && itemA.id === itemB.id) return null

  const category = scoreCategory(itemA, itemB)
  const keywords = scoreKeywords(itemA, itemB)
  const location = scoreLocation(itemA, itemB)
  const date = scoreDate(itemA, itemB)

  const reasons = []
  if (category.points > 0) reasons.push({ label: category.label, points: category.points })
  if (keywords.points > 0) {
    reasons.push({
      label: `${keywords.shared.length} shared keyword${keywords.shared.length === 1 ? '' : 's'}: ${keywords.shared.join(', ')}`,
      points: keywords.points,
    })
  }
  if (location.points > 0) reasons.push({ label: location.label, points: location.points })
  if (date.points > 0) reasons.push({ label: date.label, points: date.points })

  const score = category.points + keywords.points + location.points + date.points

  return {
    score,
    reasons,
    sharedKeywords: keywords.shared,
    categoryMatch: category.points > 0,
  }
}

export function findMatches(item, allItems, { minScore = MATCH_THRESHOLD, limit = 5 } = {}) {
  if (!item || !Array.isArray(allItems)) return []

  return allItems
    .filter((candidate) => {
      if (!candidate || candidate.id === item.id) return false
      if (candidate.type === item.type) return false
      if (item.user_id && candidate.user_id === item.user_id) return false
      if (!['open', 'in_review'].includes(candidate.status)) return false
      return true
    })
    .map((candidate) => {
      const match = getMatchScore(item, candidate)
      return match ? { item: candidate, ...match } : null
    })
    .filter(
      (match) =>
        match &&
        match.score >= minScore &&
        (match.categoryMatch || match.sharedKeywords.length >= 3),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function matchTier(score) {
  if (score >= 75) {
    return {
      label: 'Strong match',
      text: 'text-moss',
      bg: 'bg-moss-soft',
      bar: 'bg-moss',
    }
  }
  if (score >= 55) {
    return {
      label: 'Possible match',
      text: 'text-yellow-800',
      bg: 'bg-gold-soft',
      bar: 'bg-gold',
    }
  }
  return {
    label: 'Worth checking',
    text: 'text-ink/60',
    bg: 'bg-ink/5',
    bar: 'bg-ink/30',
  }
}
