import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  SearchX,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  UserRound,
} from 'lucide-react'
import ItemVisual from '../components/ItemVisual'
import { ClaimStatusBadge, StatusBadge, TypeBadge } from '../components/Badges'
import Avatar from '../components/Avatar'
import ContactLink from '../components/ContactLink'
import EmptyState from '../components/EmptyState'
import MatchCard from '../components/MatchCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { PageLoader, Spinner } from '../components/Loading'
import { useAuth } from '../context/useAuth'
import {
  createClaim,
  deleteItem,
  getItem,
  getItemContact,
  getMyClaims,
  listItems,
  subscribeTable,
  updateItem,
} from '../lib/api'
import { findMatches } from '../lib/matching'
import { formatDate, timeAgo } from '../lib/utils'
import { toast } from '../lib/toast'

function getMyLatestClaim(claims, itemId) {
  return claims
    .filter((claim) => claim.item_id === itemId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
}

export default function ItemDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [item, setItem] = useState(null)
  const [items, setItems] = useState([])
  const [myClaims, setMyClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contact, setContact] = useState(null)

  const [claimMessage, setClaimMessage] = useState('')
  const [claimError, setClaimError] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [working, setWorking] = useState(false)

  const load = useCallback(async () => {
    try {
      const [record, all] = await Promise.all([getItem(id), listItems()])
      if (!record) {
        setError('not-found')
        return
      }
      setError('')
      setItem(record)
      setItems(all)
    } catch (err) {
      setError(err.message || 'Could not load this report.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
    return subscribeTable('items', load)
  }, [load])

  useEffect(() => {
    if (!user) return
    let active = true
    getMyClaims()
      .then((claims) => {
        if (active) setMyClaims(claims)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user, item?.status])

  const isOwner = Boolean(item && user && item.user_id === user.id)
  const isAdmin = user?.role === 'admin'
  const myClaim = item ? getMyLatestClaim(myClaims, item.id) : null
  const pendingClaim = myClaim?.status === 'pending' ? myClaim : null

  const itemId = item?.id

  useEffect(() => {
    if (!itemId || !(isOwner || isAdmin)) {
      setContact(null)
      return
    }
    let active = true
    getItemContact(itemId)
      .then((value) => {
        if (active) setContact(value)
      })
      .catch(() => {
        if (active) setContact(null)
      })
    return () => {
      active = false
    }
  }, [itemId, isOwner, isAdmin])

  const matches = useMemo(() => {
    if (!item || item.status === 'resolved') return []
    return findMatches(item, items, { limit: 4 })
  }, [item, items])

  const handleClaim = async (event) => {
    event.preventDefault()
    setClaimError('')
    if (claimMessage.trim().length < 20) {
      setClaimError('Please write at least 20 characters describing your proof.')
      return
    }
    setClaiming(true)
    try {
      await createClaim(item.id, claimMessage)
      setClaimMessage('')
      toast.success('Claim submitted. An admin will review it.')
      const [record, claims] = await Promise.all([getItem(id), getMyClaims()])
      setItem(record)
      setMyClaims(claims)
    } catch (err) {
      setClaimError(err.message || 'Could not submit the claim.')
      toast.error(err.message || 'Could not submit the claim.')
    } finally {
      setClaiming(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirmAction) return
    setWorking(true)
    try {
      if (confirmAction === 'resolve') {
        await updateItem(item.id, { status: 'resolved' })
        toast.success('Item marked as recovered.')
        setItem((current) => (current ? { ...current, status: 'resolved' } : current))
      } else if (confirmAction === 'delete') {
        await deleteItem(item.id)
        toast.success('Report deleted.')
        navigate(isAdmin && !isOwner ? '/admin' : '/dashboard')
        return
      }
      setConfirmAction(null)
    } catch (err) {
      toast.error(err.message || 'The action could not be completed.')
    } finally {
      setWorking(false)
    }
  }

  if (loading) return <PageLoader label="Loading report…" />

  if (error === 'not-found' || (!item && !error)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={SearchX}
          title="Report not found"
          body="This listing may have been removed, or the link is incorrect."
          action={
            <Link to="/browse" className="btn-primary">
              Back to the board
            </Link>
          }
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={AlertCircle}
          title="Something went wrong"
          body={error}
          action={
            <button onClick={load} className="btn-primary">
              Try again
            </button>
          }
        />
      </div>
    )
  }

  const dateLabel = item.type === 'lost' ? 'Last seen' : 'Found on'
  const canClaim = item.type === 'found' && !isOwner && item.status !== 'resolved'

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link
        to="/browse"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/45 transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to the board
      </Link>

      {item.status === 'resolved' && (
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-moss/20 bg-moss-soft/60 px-4 py-3 text-sm text-moss">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <p>
            <span className="font-semibold">Recovered.</span> This item has been reunited with
            its owner and is no longer listed as active.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
        <div>
          <div className="card overflow-hidden">
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <ItemVisual item={item} iconClassName="h-20 w-20" />
              <div className="absolute left-4 top-4">
                <TypeBadge type={item.type} />
              </div>
              <div className="absolute right-4 top-4">
                <StatusBadge status={item.status} className="bg-paper/90 backdrop-blur" />
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40">
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> {item.category}
                </span>
                <span className="h-1 w-1 rounded-full bg-ink/20" />
                <span>Posted {timeAgo(item.created_at)}</span>
                {isOwner && (
                  <span className="chip bg-moss-soft !px-2 !py-0 text-moss">Your report</span>
                )}
                {isAdmin && !isOwner && (
                  <span className="chip bg-gold-soft !px-2 !py-0 text-yellow-800">
                    Admin view
                  </span>
                )}
              </div>

              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                {item.title}
              </h1>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink/55">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-moss" />
                  {item.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-moss" />
                  {dateLabel} {formatDate(item.event_date)}
                </span>
                {item.status === 'in_review' && (
                  <span className="inline-flex items-center gap-1.5 text-yellow-800">
                    <Clock className="h-3.5 w-3.5" />
                    A claim is under admin review
                  </span>
                )}
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">
                  Description
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/70">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-cream/80 px-4 py-3">
                <Avatar name={item.owner?.full_name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    Reported by {item.owner?.full_name || 'a student'}
                    {isOwner && ' (you)'}
                  </p>
                  <p className="text-[11px] text-ink/45">
                    {item.type === 'lost'
                      ? 'Looking for a safe return'
                      : 'Keeping this item safe until it is verified'}
                  </p>
                </div>
                <ShieldCheck className="ml-auto h-4 w-4 shrink-0 text-moss/50" />
              </div>

              {(isOwner || isAdmin) && contact && (
                <div className="mt-3 rounded-xl border border-line bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/35">
                        {isAdmin && !isOwner
                          ? 'Reporter contact · admin only'
                          : 'Your contact for this report'}
                      </p>
                      <ContactLink contact={contact} className="mt-1" />
                    </div>
                    <ShieldCheck className="h-4 w-4 text-moss/40" />
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-ink/35">
                    Private. Admins use this to connect the finder and the owner after a claim
                    is verified.
                  </p>
                </div>
              )}
            </div>
          </div>

          {matches.length > 0 && (
            <section className="mt-8">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-moss">
                    Smart matching
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">
                    Potential matches on the board
                  </h2>
                </div>
                <p className="inline-flex items-center gap-1.5 text-xs text-ink/45">
                  <Sparkles className="h-3.5 w-3.5 text-gold" />
                  Every score shows its breakdown
                </p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {matches.map((match) => (
                  <MatchCard key={match.item.id} match={match} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {canClaim && !pendingClaim && (
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-moss-soft text-moss">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold tracking-tight">
                    {myClaim?.status === 'rejected' ? 'Submit a new claim' : 'Claim this item'}
                  </h2>
                  <p className="text-[10px] text-ink/40">Reviewed by a campus admin</p>
                </div>
              </div>

              {myClaim?.status === 'rejected' && (
                <div className="mt-3 rounded-xl bg-coral-soft/70 px-3 py-2.5 text-[11px] leading-relaxed text-ink/60">
                  Your previous claim was not approved.
                  {myClaim.review_note && (
                    <> <span className="font-medium">Admin note:</span> {myClaim.review_note}</>
                  )}
                </div>
              )}

              <p className="mt-3 text-xs leading-relaxed text-ink/55">
                Explain why this is yours. Mention details that are not public — a scratch, a
                sticker, what is inside, a serial number.
              </p>

              <form onSubmit={handleClaim} className="mt-3">
                <label htmlFor="claim-message" className="label">
                  Your proof of ownership
                </label>
                <textarea
                  id="claim-message"
                  rows={4}
                  className="input resize-none leading-relaxed"
                  placeholder="This is mine because…"
                  value={claimMessage}
                  maxLength={2000}
                  onChange={(event) => setClaimMessage(event.target.value)}
                  disabled={claiming}
                />
                <div className="mt-1 flex items-center justify-between gap-2">
                  {claimError ? (
                    <p className="text-[11px] font-medium text-coral">{claimError}</p>
                  ) : (
                    <p className="text-[10px] text-ink/35">At least 20 characters.</p>
                  )}
                  <span className="text-[10px] text-ink/30">{claimMessage.length}/2000</span>
                </div>
                <button type="submit" className="btn-primary mt-3 w-full" disabled={claiming}>
                  {claiming && <Spinner className="h-4 w-4" />}
                  {claiming ? 'Submitting…' : 'Submit claim for review'}
                </button>
              </form>

              <p className="mt-3 text-[10px] leading-relaxed text-ink/35">
                Claims are visible only to you and admins. The item owner is notified that a
                claim was submitted, but not what you wrote.
              </p>
            </div>
          )}

          {pendingClaim && (
            <div className="card p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold tracking-tight">Your claim</h2>
                <ClaimStatusBadge status={pendingClaim.status} />
              </div>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink/55">
                “{pendingClaim.message}”
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink/40">
                <Clock className="h-3.5 w-3.5" />
                Submitted {timeAgo(pendingClaim.created_at)}
              </div>
              <div className="mt-3 rounded-xl bg-gold-soft/60 px-3 py-2.5 text-[11px] leading-relaxed text-yellow-900">
                An admin is verifying ownership. You will get a notification when the item is
                approved or your claim is rejected.
              </div>
            </div>
          )}

          {isOwner && (
            <div className="card p-5">
              <h2 className="font-display text-base font-bold tracking-tight">Manage your report</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink/50">
                {item.status === 'resolved'
                  ? 'This report is closed. Thanks for using CampusFind.'
                  : item.status === 'in_review'
                    ? 'A claim is waiting for admin review. Once it is approved, the item will be marked recovered automatically.'
                    : item.type === 'found'
                      ? 'Keep the item safe. When an admin approves a claim, this listing closes automatically.'
                      : 'If you got the item back outside the platform, mark it recovered so it leaves active listings.'}
              </p>

              {item.status === 'open' && (
                <button
                  onClick={() => setConfirmAction('resolve')}
                  className="btn-primary mt-4 w-full"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark as recovered
                </button>
              )}

              <button
                onClick={() => setConfirmAction('delete')}
                className="btn-ghost mt-2 w-full !text-coral hover:!bg-coral-soft/60"
              >
                <Trash2 className="h-4 w-4" /> Delete report
              </button>
            </div>
          )}

          {isAdmin && !isOwner && (
            <div className="card p-5">
              <h2 className="font-display text-base font-bold tracking-tight">Admin actions</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink/50">
                Review pending claims from the admin dashboard, or remove this listing if it
                violates campus rules.
              </p>
              <Link to="/admin" className="btn-outline mt-3 w-full">
                <ShieldCheck className="h-4 w-4" /> Open claim queue
              </Link>
              <button
                onClick={() => setConfirmAction('delete')}
                className="btn-ghost mt-2 w-full !text-coral hover:!bg-coral-soft/60"
              >
                <Trash2 className="h-4 w-4" /> Remove listing
              </button>
            </div>
          )}

          {item.type === 'lost' && !isOwner && (
            <div className="card p-5">
              <h2 className="font-display text-base font-bold tracking-tight">
                Did you find this item?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-ink/50">
                Post a found report with the same category and location. The match engine will
                connect your report to this one and the owner gets a notification.
              </p>
              <Link to="/report?type=found" className="btn-primary mt-3 w-full">
                Report a found item
              </Link>
            </div>
          )}

          {!isOwner && item.type === 'found' && item.status === 'resolved' && (
            <div className="card p-5">
              <h2 className="font-display text-base font-bold tracking-tight">Already recovered</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink/50">
                This item has been returned to a verified owner, so claims are closed. Keep an
                eye on the board in case something similar turns up.
              </p>
              <Link to="/browse" className="btn-outline mt-3 w-full">
                Browse the board
              </Link>
            </div>
          )}

          <div className="rounded-3xl border border-line bg-paper p-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/40">
              How recovery works
            </h2>
            <ol className="mt-3 space-y-3">
              {[
                { icon: MessageSquare, text: 'Student submits a claim with proof.' },
                { icon: ShieldCheck, text: 'An admin reviews the evidence and details.' },
                { icon: CheckCircle2, text: 'Approval marks the item recovered automatically.' },
                { icon: UserRound, text: 'The owner is notified and both parties coordinate pickup.' },
              ].map((step, index) => (
                <li key={step.text} className="flex items-start gap-2.5 text-[11px] text-ink/55">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cream font-semibold text-moss">
                    {index + 1}
                  </span>
                  {step.text}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        loading={working}
        tone={confirmAction === 'delete' ? 'coral' : 'primary'}
        title={confirmAction === 'delete' ? 'Delete this report?' : 'Mark as recovered?'}
        body={
          confirmAction === 'delete'
            ? 'This permanently removes the listing and its claims. Photos are cleaned up too. This cannot be undone.'
            : 'This tells the campus the item is back with its owner and removes it from active listings. You can only do this while no claims are awaiting review.'
        }
        confirmLabel={confirmAction === 'delete' ? 'Delete report' : 'Mark recovered'}
      />
    </div>
  )
}
