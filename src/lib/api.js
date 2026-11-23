import { createClient } from '@supabase/supabase-js'
import { demoApi, subscribeTable as subscribeDemoTable } from './demo'
import { prepareImage } from './images'
import {
  STUDENT_EMAIL_SUFFIX,
  isStudentEmail,
  normalizeEmail,
  studentNameFromEmail,
} from './auth-domain'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
const looksConfigured =
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_KEY.length > 20 &&
  !/(your|example|placeholder)/i.test(`${SUPABASE_URL}${SUPABASE_KEY}`)

export const isDemoMode = !looksConfigured

const supabase = looksConfigured ? createClient(SUPABASE_URL, SUPABASE_KEY) : null

const BUCKET = 'item-photos'
const ITEM_SELECT = '*, owner:profiles!items_user_id_fkey(id, full_name, role)'
const CLAIM_SELECT =
  '*, item:items(*, owner:profiles!items_user_id_fkey(id, full_name, role)), claimant:profiles!claims_claimant_id_fkey(id, full_name, role)'

function fail(error, fallback = 'Something went wrong. Please try again.') {
  if (error instanceof Error) throw error
  throw new Error(error?.message || fallback)
}

async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Please sign in to continue.')
  return user
}

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .maybeSingle()
  return data
}

async function uploadPhoto(blob, userId) {
  const path = `${userId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) fail(error, 'The photo could not be uploaded. Please try a smaller image.')
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function removePhoto(imageUrl) {
  if (!imageUrl) return
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const index = imageUrl.indexOf(marker)
  if (index === -1) return
  const path = decodeURIComponent(imageUrl.slice(index + marker.length).split('?')[0])
  await supabase.storage
    .from(BUCKET)
    .remove([path])
    .catch(() => {})
}

export async function getCurrentUser() {
  if (isDemoMode) return demoApi.getCurrentUser()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return null

  const profile = await fetchProfile(session.user.id)
  return {
    id: session.user.id,
    email: session.user.email,
    full_name:
      profile?.full_name ||
      session.user.user_metadata?.full_name ||
      session.user.email?.split('@')[0] ||
      'Student',
    role: profile?.role || 'student',
  }
}

export async function signIn(email, password) {
  if (isDemoMode) return demoApi.signIn(email, password)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (/invalid login credentials/i.test(error.message)) {
      throw new Error('Incorrect email or password. Please try again.')
    }
    fail(error)
  }
  const user = await getCurrentUser()
  if (!user) throw new Error('Your profile could not be loaded. Please try again.')
  return { ...user, id: data.user.id }
}

export async function requestStudentOtp(email) {
  const normalized = normalizeEmail(email)
  if (!isStudentEmail(normalized)) {
    throw new Error(`Use your student Outlook email ending in ${STUDENT_EMAIL_SUFFIX}.`)
  }
  if (isDemoMode) return demoApi.requestStudentOtp(normalized)

  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      shouldCreateUser: true,
      data: { full_name: studentNameFromEmail(normalized) },
    },
  })
  if (error) {
    if (/rate limit|too many/i.test(error.message)) {
      throw new Error('Too many code requests. Please wait a few minutes and try again.')
    }
    fail(error, 'The sign-in link could not be sent. Please try again.')
  }
  return {}
}

export async function verifyStudentOtp(email, token) {
  const normalized = normalizeEmail(email)
  if (!isStudentEmail(normalized)) {
    throw new Error(`Use your student Outlook email ending in ${STUDENT_EMAIL_SUFFIX}.`)
  }
  if (isDemoMode) return demoApi.verifyStudentOtp(normalized, token)

  const { error } = await supabase.auth.verifyOtp({
    email: normalized,
    token: String(token).trim(),
    type: 'email',
  })
  if (error) {
    if (/expired|invalid/i.test(error.message)) {
      throw new Error('That code is invalid or has expired. Request a new one.')
    }
    fail(error, 'The code could not be verified.')
  }
  const user = await getCurrentUser()
  if (!user) throw new Error('Your session could not be created. Please request a new code.')
  return user
}

export async function signOut() {
  if (isDemoMode) return demoApi.signOut()
  const { error } = await supabase.auth.signOut()
  if (error) fail(error)
}

export async function listItems() {
  if (isDemoMode) return demoApi.listItems()
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_SELECT)
    .order('created_at', { ascending: false })
  if (error) fail(error)
  return data ?? []
}

export async function getItem(id) {
  if (isDemoMode) return demoApi.getItem(id)
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) fail(error)
  return data
}

export async function createItem(payload) {
  const { imageFile, ...fields } = payload
  const user = await requireUser()

  let image_url = null
  if (imageFile) {
    const prepared = await prepareImage(imageFile)
    image_url = isDemoMode ? prepared.dataUrl : await uploadPhoto(prepared.blob, user.id)
  }

  if (isDemoMode) {
    return demoApi.createItem({
      ...fields,
      title: fields.title,
      description: fields.description,
      category: fields.category,
      location: fields.location,
      event_date: fields.event_date,
      type: fields.type,
      image_url,
    })
  }

  const { data, error } = await supabase
    .from('items')
    .insert({
      user_id: user.id,
      type: fields.type,
      title: fields.title.trim(),
      description: fields.description.trim(),
      category: fields.category,
      location: fields.location,
      event_date: fields.event_date,
      image_url,
    })
    .select(ITEM_SELECT)
    .single()
  if (error) fail(error, 'Your report could not be saved. Please try again.')
  return data
}

export async function updateItem(id, patch) {
  if (isDemoMode) return demoApi.updateItem(id, patch)
  await requireUser()
  const { data, error } = await supabase
    .from('items')
    .update(patch)
    .eq('id', id)
    .select(ITEM_SELECT)
    .single()
  if (error) fail(error, 'The report could not be updated.')
  return data
}

export async function deleteItem(id) {
  if (isDemoMode) return demoApi.deleteItem(id)
  await requireUser()
  const item = await getItem(id)
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) fail(error, 'The report could not be deleted.')
  if (item?.image_url) await removePhoto(item.image_url)
  return true
}

export async function getMyClaims() {
  if (isDemoMode) return demoApi.getMyClaims()
  const user = await requireUser()
  const { data, error } = await supabase
    .from('claims')
    .select(CLAIM_SELECT)
    .eq('claimant_id', user.id)
    .order('created_at', { ascending: false })
  if (error) fail(error)
  return data ?? []
}

export async function createClaim(itemId, message) {
  if (isDemoMode) return demoApi.createClaim(itemId, message)
  const user = await requireUser()
  const { data, error } = await supabase
    .from('claims')
    .insert({
      item_id: itemId,
      claimant_id: user.id,
      message: message.trim(),
    })
    .select(CLAIM_SELECT)
    .single()
  if (error) {
    if (error.code === '23505') {
      throw new Error('You already have a pending claim for this item.')
    }
    if (error.code === '42501') {
      throw new Error('This item can no longer be claimed.')
    }
    fail(error, 'Your claim could not be submitted.')
  }
  return data
}

export async function listAllClaims() {
  if (isDemoMode) return demoApi.listAllClaims()
  await requireUser()
  const { data, error } = await supabase
    .from('claims')
    .select(CLAIM_SELECT)
    .order('created_at', { ascending: false })
  if (error) fail(error)
  return data ?? []
}

export async function reviewClaim(claimId, decision, note = '') {
  if (isDemoMode) return demoApi.reviewClaim(claimId, decision, note)
  const user = await requireUser()
  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error('Invalid review decision.')
  }
  const { data, error } = await supabase
    .from('claims')
    .update({
      status: decision,
      review_note: note.trim() || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', claimId)
    .select(CLAIM_SELECT)
    .single()
  if (error) fail(error, 'The claim could not be reviewed.')
  return data
}

export async function listProfiles() {
  if (isDemoMode) return demoApi.listProfiles()
  await requireUser()
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) fail(error, 'The user directory could not be loaded.')
  return (data ?? []).map((user) => ({ ...user, report_count: Number(user.report_count) }))
}

export async function listNotifications() {
  if (isDemoMode) return demoApi.listNotifications()
  const user = await requireUser()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) fail(error)
  return data ?? []
}

export async function markNotificationRead(id) {
  if (isDemoMode) return demoApi.markNotificationRead(id)
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  if (error) fail(error)
}

export async function markAllNotificationsRead() {
  if (isDemoMode) return demoApi.markAllNotificationsRead()
  const user = await requireUser()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
  if (error) fail(error)
}

export function subscribeTable(table, callback) {
  if (isDemoMode) return subscribeDemoTable(table, callback)
  const channel = supabase
    .channel(`campusfind-${table}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

export function resetDemoData() {
  if (isDemoMode) demoApi.reset()
}
