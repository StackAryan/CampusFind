import {
  DEMO_OTP_CODE,
  DEMO_STUDENT_EMAIL,
  isValidEmail,
  normalizeEmail,
  studentNameFromEmail,
} from './auth-domain'

const DB_KEY = 'campusfind_demo_v2'
const SESSION_KEY = 'campusfind_demo_session'

let db = null
const tableListeners = new Map()

function uuid() {
  return crypto.randomUUID()
}

function isoDaysAgo(days, hours = 0) {
  return new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString()
}

function dateDaysAgo(days) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function makeUser(email, fullName, role, password, createdDaysAgo = 30) {
  return {
    id: uuid(),
    email,
    full_name: fullName,
    role,
    password,
    created_at: isoDaysAgo(createdDaysAgo),
  }
}

function seed() {
  const admin = makeUser('admin@campus.edu', 'Campus Admin', 'admin', 'admin123', 120)
  const avery = makeUser(
    DEMO_STUDENT_EMAIL,
    'Avery Johnson',
    'student',
    null,
    90,
  )
  const maya = makeUser(
    'maya.chen@example.com',
    'Maya Chen',
    'student',
    'demo1234',
    80,
  )
  const jordan = makeUser(
    'jordan.ellis@example.com',
    'Jordan Ellis',
    'student',
    'demo1234',
    75,
  )
  const sam = makeUser(
    'sam.patel@example.com',
    'Sam Patel',
    'student',
    'demo1234',
    60,
  )
  const priya = makeUser(
    'priya.nair@example.com',
    'Priya Nair',
    'student',
    'demo1234',
    45,
  )
  const alex = makeUser(
    'alex.rivera@example.com',
    'Alex Rivera',
    'student',
    'demo1234',
    40,
  )

  const users = [admin, avery, maya, jordan, sam, priya, alex]

  const item = (owner, type, fields, daysAgo, status = 'open') => ({
    id: uuid(),
    user_id: owner.id,
    type,
    status,
    image_url: null,
    created_at: isoDaysAgo(daysAgo, 2),
    updated_at: isoDaysAgo(daysAgo, 1),
    ...fields,
  })

  const earbudsLost = item(
    avery,
    'lost',
    {
      title: 'Black wireless earbuds',
      description:
        'Lost my black wireless earbuds in a white charging case near the CENTRAL LIBRARY entrance. I think they slipped out of my tote bag around midday.',
      category: 'Electronics',
      location: 'CENTRAL LIBRARY',
      event_date: dateDaysAgo(2),
    },
    2,
  )

  const earbudsFound = item(
    maya,
    'found',
    {
      title: 'Black wireless earbuds',
      description:
        'Found a pair of black wireless earbuds in a white charging case outside CENTRAL LIBRARY by the bike racks. Both earbuds were still inside.',
      category: 'Electronics',
      location: 'CENTRAL LIBRARY',
      event_date: dateDaysAgo(1),
    },
    1,
  )

  const idLost = item(
    avery,
    'lost',
    {
      title: 'Student ID card',
      description:
        'Lost my student ID somewhere between CENTRAL LIBRARY and AKC FOOD COURT. The name on the card is Avery Johnson and it was on a blue lanyard.',
      category: 'ID & Cards',
      location: 'AKC FOOD COURT',
      event_date: dateDaysAgo(5),
    },
    5,
  )

  const idFound = item(
    sam,
    'found',
    {
      title: 'Student ID card',
      description:
        'Found a student ID card near the printing station at AU - 1. The name printed on it is Avery Johnson. It has a small scratch near the photo.',
      category: 'ID & Cards',
      location: 'AU - 1',
      event_date: dateDaysAgo(4),
    },
    4,
    'in_review',
  )

  const bottleLost = item(
    priya,
    'lost',
    {
      title: 'Blue Hydro Flask water bottle',
      description:
        'Lost my blue Hydro Flask at SOET GROUND. It has a red National Park sticker and my initials PN scratched on the bottom.',
      category: 'Bottles',
      location: 'SOET GROUND',
      event_date: dateDaysAgo(4),
    },
    4,
  )

  const bottleFound = item(
    jordan,
    'found',
    {
      title: 'Blue Hydro Flask',
      description:
        'Found a blue Hydro Flask near the SOET GROUND courts. There is a red National Park sticker on the side and the initials PN on the bottom.',
      category: 'Bottles',
      location: 'SOET GROUND',
      event_date: dateDaysAgo(3),
    },
    3,
    'in_review',
  )

  const walletLost = item(
    alex,
    'lost',
    {
      title: 'Brown leather wallet',
      description:
        'Lost my brown leather wallet, probably at AKC FOOD COURT during lunch. It has my student card, a bus pass and a small photo inside.',
      category: 'Wallets & Purses',
      location: 'AKC FOOD COURT',
      event_date: dateDaysAgo(3),
    },
    3,
  )

  const walletFound = item(
    jordan,
    'found',
    {
      title: 'Brown leather wallet',
      description:
        'Found a brown leather wallet on one of the tables at AKC FOOD COURT. I did not go through it. It is being kept safe until the owner claims it.',
      category: 'Wallets & Purses',
      location: 'AKC FOOD COURT',
      event_date: dateDaysAgo(2),
    },
    2,
  )

  const keysLost = item(
    alex,
    'lost',
    {
      title: 'Keys with a green lanyard',
      description:
        'Lost my keys somewhere around ADAMAS BUS STAND. Three keys on a green carabiner lanyard, including a small bike lock key.',
      category: 'Keys',
      location: 'ADAMAS BUS STAND',
      event_date: dateDaysAgo(6),
    },
    6,
  )

  const keysFound = item(
    sam,
    'found',
    {
      title: 'Green lanyard keys',
      description:
        'Found a set of keys with a green lanyard on the ground near ADAMAS BUS STAND. There are three keys and a small bike lock key.',
      category: 'Keys',
      location: 'ADAMAS BUS STAND',
      event_date: dateDaysAgo(5),
    },
    5,
  )

  const hoodieFound = item(
    avery,
    'found',
    {
      title: 'Charcoal hoodie',
      description:
        'Found a charcoal grey hoodie left on a bench at SOET GROUND. Size medium, with a small tear on the left sleeve.',
      category: 'Clothing',
      location: 'SOET GROUND',
      event_date: dateDaysAgo(3),
    },
    3,
    'in_review',
  )

  const calculatorLost = item(
    priya,
    'lost',
    {
      title: 'Casio scientific calculator',
      description:
        'Lost my Casio scientific calculator in AU - 6 SOET, probably in room 204. The serial number ends in 4471.',
      category: 'Electronics',
      location: 'AU - 6 SOET',
      event_date: dateDaysAgo(7),
    },
    7,
  )

  const calculatorFound = item(
    sam,
    'found',
    {
      title: 'Casio scientific calculator',
      description:
        'Found a Casio scientific calculator in AU - 6 SOET room 204. The serial number ends in 4471 and the name Priya is written inside.',
      category: 'Electronics',
      location: 'AU - 6 SOET',
      event_date: dateDaysAgo(6),
    },
    6,
    'resolved',
  )

  const items = [
    earbudsFound,
    earbudsLost,
    walletFound,
    walletLost,
    hoodieFound,
    bottleFound,
    bottleLost,
    idFound,
    idLost,
    keysFound,
    keysLost,
    calculatorFound,
    calculatorLost,
  ]

  const claim = (itemRecord, claimant, message, status, daysAgo, note = null) => ({
    id: uuid(),
    item_id: itemRecord.id,
    claimant_id: claimant.id,
    message,
    status,
    review_note: note,
    reviewed_at: status === 'pending' ? null : isoDaysAgo(daysAgo - 1),
    reviewed_by: status === 'pending' ? null : admin.id,
    created_at: isoDaysAgo(daysAgo),
  })

  const claims = [
    claim(
      idFound,
      avery,
      'This is my student ID card. The name printed on it is Avery Johnson and there is a small scratch on the bottom right corner of the photo.',
      'pending',
      1,
    ),
    claim(
      bottleFound,
      priya,
      'That is my blue Hydro Flask. It has a red National Park sticker and my initials PN scratched on the bottom, exactly like the description.',
      'pending',
      2,
    ),
    claim(
      hoodieFound,
      alex,
      'I think this is my hoodie. It is a medium charcoal hoodie and it has a small tear on the left sleeve from a bike accident.',
      'pending',
      1,
    ),
    claim(
      calculatorFound,
      priya,
      'This is my Casio calculator. The serial number ends in 4471 and my name is written inside the battery cover.',
      'approved',
      2,
      'Serial number and name inside the battery cover matched the receipt Priya provided.',
    ),
  ]

  const notification = (userRecord, title, body, link, daysAgo, read = false) => ({
    id: uuid(),
    user_id: userRecord.id,
    title,
    body,
    link,
    read,
    created_at: isoDaysAgo(daysAgo),
  })

  const notifications = [
    notification(
      avery,
      'New claim received',
      'Someone submitted a claim for "Charcoal hoodie". An admin will verify it.',
      `/items/${hoodieFound.id}`,
      1,
    ),
    notification(
      admin,
      'Claims waiting for review',
      'There are 3 pending claims that need an ownership decision.',
      '/admin',
      1,
    ),
    notification(
      priya,
      'Claim approved',
      'Your claim for "Casio scientific calculator" was approved. Note: Serial number and name inside the battery cover matched the receipt Priya provided.',
      `/items/${calculatorFound.id}`,
      1,
    ),
    notification(
      sam,
      'Item recovered',
      '"Casio scientific calculator" has been marked as recovered.',
      `/items/${calculatorFound.id}`,
      1,
      true,
    ),
    notification(
      jordan,
      'New claim received',
      'Someone submitted a claim for "Blue Hydro Flask". An admin will verify it.',
      `/items/${bottleFound.id}`,
      2,
      true,
    ),
  ]

  return { users, items, claims, notifications }
}

function parseStoredJson(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function getDb() {
  if (db) return db
  let stored
  try {
    stored = localStorage.getItem(DB_KEY)
  } catch {
    stored = null
  }
  const parsed = stored ? parseStoredJson(stored) : null
  if (parsed) {
    db = parsed
    return db
  }
  db = seed()
  persist()
  return db
}

function persist() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    throw new Error('Demo storage is full. Remove a few photo reports or reset the demo data.')
  }
}

function emit(table) {
  const listeners = tableListeners.get(table)
  if (!listeners) return
  for (const listener of listeners) listener()
}

function emitAll() {
  for (const table of ['items', 'claims', 'notifications', 'profiles']) emit(table)
}

export function subscribeTable(table, callback) {
  if (!tableListeners.has(table)) tableListeners.set(table, new Set())
  tableListeners.get(table).add(callback)
  return () => {
    tableListeners.get(table)?.delete(callback)
  }
}

function publicUser(user) {
  if (!user) return null
  return { id: user.id, full_name: user.full_name, role: user.role }
}

function hydrateItem(item) {
  if (!item) return null
  const owner = getDb().users.find((user) => user.id === item.user_id)
  return { ...item, owner: publicUser(owner) }
}

function hydrateClaim(claim) {
  const data = getDb()
  const item = data.items.find((candidate) => candidate.id === claim.item_id)
  const claimant = data.users.find((user) => user.id === claim.claimant_id)
  return {
    ...claim,
    item: item ? hydrateItem(item) : null,
    claimant: claimant ? { ...publicUser(claimant), email: claimant.email } : null,
  }
}

function currentUser({ required = false } = {}) {
  const data = getDb()
  const id = localStorage.getItem(SESSION_KEY)
  const user = id ? data.users.find((candidate) => candidate.id === id) : null
  if (!user && required) throw new Error('Please sign in to continue.')
  return user
}

function currentProfile() {
  const user = currentUser()
  if (!user) return null
  return { id: user.id, full_name: user.full_name, role: user.role, email: user.email }
}

function requireAdmin() {
  const user = currentUser({ required: true })
  if (user.role !== 'admin') throw new Error('Administrator access is required.')
  return user
}

function addNotification(userId, title, body, link) {
  getDb().notifications.unshift({
    id: uuid(),
    user_id: userId,
    title,
    body,
    link,
    read: false,
    created_at: new Date().toISOString(),
  })
}

export const demoApi = {
  async getCurrentUser() {
    return currentProfile()
  },

  async signIn(email, password) {
    const data = getDb()
    const user = data.users.find(
      (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
    )
    if (!user || user.password !== password) {
      throw new Error('Incorrect email or password. Please try again.')
    }
    localStorage.setItem(SESSION_KEY, user.id)
    return currentProfile()
  },

  async requestStudentOtp(email) {
    const normalized = normalizeEmail(email)
    if (!isValidEmail(normalized)) {
      throw new Error('Enter a valid email address.')
    }
    return { demoCode: DEMO_OTP_CODE }
  },

  async verifyStudentOtp(email, code) {
    const normalized = normalizeEmail(email)
    if (!isValidEmail(normalized)) {
      throw new Error('Enter a valid email address.')
    }
    if (String(code).trim() !== DEMO_OTP_CODE) {
      throw new Error('That code is incorrect. In demo mode the code is 123456.')
    }
    const data = getDb()
    let user = data.users.find((candidate) => candidate.email.toLowerCase() === normalized)
    if (!user) {
      user = {
        id: uuid(),
        email: normalized,
        full_name: studentNameFromEmail(normalized),
        role: 'student',
        password: null,
        created_at: new Date().toISOString(),
      }
      data.users.push(user)
      persist()
      emit('profiles')
    }
    localStorage.setItem(SESSION_KEY, user.id)
    return {
      id: user.id,
      full_name: user.full_name,
      role: user.role,
      email: user.email,
    }
  },

  async signOut() {
    localStorage.removeItem(SESSION_KEY)
  },

  async listItems() {
    return getDb()
      .items.slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(hydrateItem)
  },

  async getItem(id) {
    return hydrateItem(getDb().items.find((item) => item.id === id))
  },

  async createItem(payload) {
    const user = currentUser({ required: true })
    const data = getDb()
    const now = new Date().toISOString()
    const item = {
      id: uuid(),
      user_id: user.id,
      type: payload.type,
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category,
      location: payload.location,
      event_date: payload.event_date,
      image_url: payload.image_url ?? null,
      status: 'open',
      created_at: now,
      updated_at: now,
    }
    data.items.unshift(item)
    persist()
    emit('items')
    return hydrateItem(item)
  },

  async updateItem(id, patch) {
    const user = currentUser({ required: true })
    const data = getDb()
    const item = data.items.find((candidate) => candidate.id === id)
    if (!item) throw new Error('That report no longer exists.')
    if (item.user_id !== user.id && user.role !== 'admin') {
      throw new Error('You can only edit your own reports.')
    }
    if (patch.status === 'resolved' && item.status === 'in_review' && user.role !== 'admin') {
      throw new Error('This item has claims waiting for admin review.')
    }
    Object.assign(item, patch, { updated_at: new Date().toISOString() })
    persist()
    emit('items')
    return hydrateItem(item)
  },

  async deleteItem(id) {
    const user = currentUser({ required: true })
    const data = getDb()
    const item = data.items.find((candidate) => candidate.id === id)
    if (!item) throw new Error('That report no longer exists.')
    if (item.user_id !== user.id && user.role !== 'admin') {
      throw new Error('You can only delete your own reports.')
    }
    data.items = data.items.filter((candidate) => candidate.id !== id)
    data.claims = data.claims.filter((claim) => claim.item_id !== id)
    persist()
    emit('items')
    emit('claims')
    return true
  },

  async getMyClaims() {
    const user = currentUser({ required: true })
    return getDb()
      .claims.filter((claim) => claim.claimant_id === user.id)
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(hydrateClaim)
  },

  async createClaim(itemId, message) {
    const user = currentUser({ required: true })
    const data = getDb()
    const item = data.items.find((candidate) => candidate.id === itemId)
    if (!item) throw new Error('That item no longer exists.')
    if (item.type !== 'found') throw new Error('Claims can only be made on found items.')
    if (item.user_id === user.id) throw new Error('You cannot claim your own report.')
    if (item.status === 'resolved') throw new Error('This item has already been recovered.')
    if (message.trim().length < 20) throw new Error('Please add at least 20 characters of proof.')
    const hasPending = data.claims.some(
      (claim) =>
        claim.item_id === itemId && claim.claimant_id === user.id && claim.status === 'pending',
    )
    if (hasPending) throw new Error('You already have a pending claim for this item.')

    const claim = {
      id: uuid(),
      item_id: itemId,
      claimant_id: user.id,
      message: message.trim(),
      status: 'pending',
      review_note: null,
      reviewed_at: null,
      reviewed_by: null,
      created_at: new Date().toISOString(),
    }
    data.claims.unshift(claim)
    if (item.status === 'open') {
      item.status = 'in_review'
      item.updated_at = new Date().toISOString()
    }
    addNotification(
      item.user_id,
      'New claim received',
      `Someone submitted a claim for "${item.title}". An admin will verify it.`,
      `/items/${itemId}`,
    )
    persist()
    emit('claims')
    emit('items')
    emit('notifications')
    return hydrateClaim(claim)
  },

  async listAllClaims() {
    requireAdmin()
    return getDb()
      .claims.slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(hydrateClaim)
  },

  async reviewClaim(claimId, decision, note = '') {
    const admin = requireAdmin()
    if (!['approved', 'rejected'].includes(decision)) {
      throw new Error('Invalid review decision.')
    }
    const data = getDb()
    const claim = data.claims.find((candidate) => candidate.id === claimId)
    if (!claim) throw new Error('That claim no longer exists.')
    if (claim.status !== 'pending') throw new Error('This claim has already been reviewed.')

    const item = data.items.find((candidate) => candidate.id === claim.item_id)
    const now = new Date().toISOString()
    claim.status = decision
    claim.review_note = note.trim() || null
    claim.reviewed_at = now
    claim.reviewed_by = admin.id

    if (decision === 'approved' && item) {
      item.status = 'resolved'
      item.updated_at = now
      for (const other of data.claims) {
        if (
          other.item_id === claim.item_id &&
          other.id !== claim.id &&
          other.status === 'pending'
        ) {
          other.status = 'rejected'
          other.review_note = 'Another claim was approved for this item.'
          other.reviewed_at = now
          other.reviewed_by = admin.id
          addNotification(
            other.claimant_id,
            'Claim not approved',
            `Your claim for "${item.title}" was not approved. Note: Another claim was approved for this item.`,
            `/items/${item.id}`,
          )
        }
      }
      addNotification(
        claim.claimant_id,
        'Claim approved',
        `Your claim for "${item.title}" was approved.${claim.review_note ? ` Note: ${claim.review_note}` : ''}`,
        `/items/${item.id}`,
      )
      addNotification(
        item.user_id,
        'Item recovered',
        `"${item.title}" has been marked as recovered.`,
        `/items/${item.id}`,
      )
    } else {
      if (item) {
        addNotification(
          claim.claimant_id,
          'Claim not approved',
          `Your claim for "${item.title}" was not approved.${claim.review_note ? ` Note: ${claim.review_note}` : ''}`,
          `/items/${item.id}`,
        )
        const stillPending = data.claims.some(
          (candidate) =>
            candidate.item_id === item.id && candidate.id !== claim.id && candidate.status === 'pending',
        )
        if (!stillPending && item.status === 'in_review') {
          item.status = 'open'
          item.updated_at = now
        }
      }
    }

    persist()
    emit('claims')
    emit('items')
    emit('notifications')
    return hydrateClaim(claim)
  },

  async listProfiles() {
    requireAdmin()
    const data = getDb()
    return data.users
      .slice()
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((user) => ({
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        email: user.email,
        created_at: user.created_at,
        report_count: data.items.filter((item) => item.user_id === user.id).length,
      }))
  },

  async listNotifications() {
    const user = currentUser({ required: true })
    return getDb()
      .notifications.filter((notification) => notification.user_id === user.id)
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50)
  },

  async markNotificationRead(id) {
    const user = currentUser({ required: true })
    const notification = getDb().notifications.find(
      (candidate) => candidate.id === id && candidate.user_id === user.id,
    )
    if (notification) {
      notification.read = true
      persist()
      emit('notifications')
    }
  },

  async markAllNotificationsRead() {
    const user = currentUser({ required: true })
    for (const notification of getDb().notifications) {
      if (notification.user_id === user.id) notification.read = true
    }
    persist()
    emit('notifications')
  },

  reset() {
    localStorage.removeItem(DB_KEY)
    localStorage.removeItem(SESSION_KEY)
    db = null
    getDb()
    emitAll()
  },
}
