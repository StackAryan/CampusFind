import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import ItemVisual from '../components/ItemVisual'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { ClaimStatusBadge, StatusBadge, TypeBadge } from '../components/Badges'
import { PageLoader, Spinner } from '../components/Loading'
import { useAuth } from '../context/useAuth'
import {
  deleteItem,
  listAllClaims,
  listItems,
  listProfiles,
  reviewClaim,
  subscribeTable,
} from '../lib/api'
import { CATEGORY_VALUES, LOCATIONS, getCategoryMeta } from '../lib/categories'
import { cn, formatDate, pluralize, timeAgo } from '../lib/utils'
import { toast } from '../lib/toast'

const CLAIM_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

export default function Admin() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [claims, setClaims] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview')

  const [claimFilter, setClaimFilter] = useState('pending')
  const [reviewOpen, setReviewOpen] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewWorking, setReviewWorking] = useState(false)

  const [itemSearch, setItemSearch] = useState('')
  const [itemType, setItemType] = useState('all')
  const [itemStatus, setItemStatus] = useState('all')
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteWorking, setDeleteWorking] = useState(false)

  const load = useCallback(async () => {
    try {
      const [allItems, allClaims, allProfiles] = await Promise.all([
        listItems(),
        listAllClaims(),
        listProfiles(),
      ])
      setError('')
      setItems(allItems)
      setClaims(allClaims)
      setProfiles(allProfiles)
    } catch (err) {
      setError(err.message || 'Could not load the admin dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const unsubscribeItems = subscribeTable('items', load)
    const unsubscribeClaims = subscribeTable('claims', load)
    return () => {
      unsubscribeItems()
      unsubscribeClaims()
    }
  }, [load])

  const stats = useMemo(() => {
    const resolved = items.filter((item) => item.status === 'resolved').length
    return {
      open: items.filter((item) => item.status === 'open').length,
      inReview: items.filter((item) => item.status === 'in_review').length,
      resolved,
      pendingClaims: claims.filter((claim) => claim.status === 'pending').length,
      approvedClaims: claims.filter((claim) => claim.status === 'approved').length,
      rejectedClaims: claims.filter((claim) => claim.status === 'rejected').length,
      recoveryRate: items.length ? Math.round((resolved / items.length) * 100) : 0,
    }
  }, [items, claims])

  const categoryData = useMemo(() => {
    const rows = CATEGORY_VALUES.map((category) => ({
      category,
      count: items.filter((item) => item.category === category).length,
    }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count)
    const max = Math.max(1, ...rows.map((row) => row.count))
    return { rows, max }
  }, [items])

  const locationData = useMemo(() => {
    const rows = LOCATIONS.map((location) => ({
      location,
      count: items.filter((item) => item.location === location).length,
    }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    const max = Math.max(1, ...rows.map((row) => row.count))
    return { rows, max }
  }, [items])

  const pendingClaims = useMemo(
    () => claims.filter((claim) => claim.status === 'pending'),
    [claims],
  )

  const visibleClaims = useMemo(
    () =>
      claimFilter === 'all'
        ? claims
        : claims.filter((claim) => claim.status === claimFilter),
    [claims, claimFilter],
  )

  const visibleItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase()
    return items
      .filter((item) => {
        if (itemType !== 'all' && item.type !== itemType) return false
        if (itemStatus !== 'all' && item.status !== itemStatus) return false
        if (query) {
          const haystack = `${item.title} ${item.description} ${item.owner?.full_name || ''} ${item.location}`.toLowerCase()
          if (!haystack.includes(query)) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [items, itemSearch, itemType, itemStatus])

  const recentItems = useMemo(
    () =>
      items
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5),
    [items],
  )

  const handleReview = async (decision) => {
    if (!reviewOpen) return
    setReviewWorking(true)
    try {
      await reviewClaim(reviewOpen.id, decision, reviewNote)
      toast.success(
        decision === 'approved'
          ? 'Claim approved. The item was marked recovered and other claims were closed.'
          : 'Claim rejected. The claimant was notified.',
      )
      setReviewOpen(null)
      setReviewNote('')
      await load()
    } catch (err) {
      toast.error(err.message || 'The claim could not be reviewed.')
    } finally {
      setReviewWorking(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return
    setDeleteWorking(true)
    try {
      await deleteItem(itemToDelete.id)
      toast.success('Listing deleted.')
      setItemToDelete(null)
      await load()
    } catch (err) {
      toast.error(err.message || 'The listing could not be deleted.')
    } finally {
      setDeleteWorking(false)
    }
  }

  if (loading) return <PageLoader label="Loading admin dashboard…" />

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={AlertCircle}
          title="Admin dashboard could not load"
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Administrator"
        title="Operations dashboard"
        description={`Signed in as ${user?.full_name}. Review ownership claims, monitor the board and keep the campus database healthy.`}
        actions={
          <>
            <button onClick={load} className="btn-outline">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <Link to="/browse" className="btn-primary">
              View board
            </Link>
          </>
        }
      />

      <div className="mt-7 flex flex-wrap gap-1 rounded-full border border-line bg-paper p-1">
        {[
          { value: 'overview', label: 'Overview', icon: BarChart3 },
          { value: 'claims', label: 'Claims', icon: ShieldCheck, count: stats.pendingClaims },
          { value: 'items', label: 'Reports', icon: FileText },
          { value: 'users', label: 'Users', icon: Users },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setTab(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition sm:text-sm',
              tab === option.value
                ? 'bg-ink text-cream shadow-sm'
                : 'text-ink/55 hover:bg-ink/5 hover:text-ink',
            )}
          >
            <option.icon className="h-3.5 w-3.5" />
            {option.label}
            {option.count > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px]',
                  tab === option.value ? 'bg-cream/20 text-cream' : 'bg-coral text-white',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={FileText}
              label="Active reports"
              value={stats.open + stats.inReview}
              hint={`${stats.open} open · ${stats.inReview} in review`}
            />
            <StatCard
              icon={Clock}
              label="Pending claims"
              value={stats.pendingClaims}
              hint="Need an ownership decision"
              tone="gold"
            />
            <StatCard
              icon={CheckCircle2}
              label="Items recovered"
              value={stats.resolved}
              hint={`${stats.recoveryRate}% recovery rate`}
              tone="ink"
            />
            <StatCard
              icon={Users}
              label="Registered users"
              value={profiles.length}
              hint={`${profiles.filter((profile) => profile.role === 'admin').length} admin`}
              tone="coral"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold tracking-tight">
                    Reports by category
                  </h2>
                  <p className="text-xs text-ink/45">All time, including recovered items</p>
                </div>
                <BarChart3 className="h-5 w-5 text-moss/50" />
              </div>
              {categoryData.rows.length === 0 ? (
                <p className="mt-6 text-sm text-ink/40">No reports yet.</p>
              ) : (
                <div className="mt-5 space-y-3">
                  {categoryData.rows.map((row) => (
                    <div key={row.category}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-ink/65">
                          <span
                            className={cn(
                              'h-2.5 w-2.5 rounded-full bg-gradient-to-br',
                              getCategoryMeta(row.category).visual,
                            )}
                          />
                          {row.category}
                        </span>
                        <span className="font-semibold text-ink/45">{row.count}</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cream">
                        <div
                          className="h-full rounded-full bg-moss"
                          style={{ width: `${(row.count / categoryData.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold tracking-tight">
                    Claim decisions
                  </h2>
                  <ShieldCheck className="h-4 w-4 text-moss/50" />
                </div>
                <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-cream">
                  {claims.length > 0 && (
                    <>
                      <div
                        className="bg-gold"
                        style={{ width: `${(stats.pendingClaims / claims.length) * 100}%` }}
                        title={`${stats.pendingClaims} pending`}
                      />
                      <div
                        className="bg-moss"
                        style={{ width: `${(stats.approvedClaims / claims.length) * 100}%` }}
                        title={`${stats.approvedClaims} approved`}
                      />
                      <div
                        className="bg-coral"
                        style={{ width: `${(stats.rejectedClaims / claims.length) * 100}%` }}
                        title={`${stats.rejectedClaims} rejected`}
                      />
                    </>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Pending', stats.pendingClaims, 'text-yellow-800'],
                    ['Approved', stats.approvedClaims, 'text-moss'],
                    ['Rejected', stats.rejectedClaims, 'text-coral'],
                  ].map(([label, value, color]) => (
                    <div key={label} className="rounded-xl bg-cream/70 px-2 py-2.5">
                      <p className={cn('font-display text-xl font-extrabold', color)}>{value}</p>
                      <p className="text-[10px] uppercase tracking-wider text-ink/40">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold tracking-tight">
                    Top locations
                  </h2>
                  <MapPin className="h-4 w-4 text-coral/60" />
                </div>
                {locationData.rows.length === 0 ? (
                  <p className="mt-3 text-xs text-ink/40">No location data yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {locationData.rows.map((row) => (
                      <li key={row.location} className="flex items-center gap-2 text-xs">
                        <span className="w-32 truncate text-ink/60">{row.location}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream">
                          <span
                            className="block h-full rounded-full bg-coral/70"
                            style={{ width: `${(row.count / locationData.max) * 100}%` }}
                          />
                        </span>
                        <span className="w-4 text-right font-semibold text-ink/40">
                          {row.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold tracking-tight">Review queue</h2>
                {pendingClaims.length > 0 && (
                  <button
                    onClick={() => {
                      setTab('claims')
                      setClaimFilter('pending')
                    }}
                    className="text-xs font-semibold text-moss hover:underline"
                  >
                    Open all
                  </button>
                )}
              </div>
              {pendingClaims.length === 0 ? (
                <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-moss-soft/50 px-3.5 py-3 text-xs text-moss">
                  <CheckCircle2 className="h-4 w-4" /> The queue is clear. Nice work.
                </div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {pendingClaims.slice(0, 3).map((claim) => (
                    <button
                      key={claim.id}
                      onClick={() => {
                        setReviewOpen(claim)
                        setReviewNote('')
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-left transition hover:border-moss/30 hover:bg-moss-soft/20"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                        {claim.item ? (
                          <ItemVisual item={claim.item} iconClassName="h-5 w-5" />
                        ) : (
                          <div className="grid h-full w-full place-items-center bg-cream">
                            <FileText className="h-4 w-4 text-ink/30" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {claim.item?.title || 'Removed listing'}
                        </p>
                        <p className="truncate text-[11px] text-ink/45">
                          {claim.claimant?.full_name} · {timeAgo(claim.created_at)}
                        </p>
                      </div>
                      <span className="chip bg-gold-soft text-yellow-800">Review</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold tracking-tight">
                  Latest reports
                </h2>
                <TrendingUp className="h-4 w-4 text-moss/50" />
              </div>
              <div className="mt-4 divide-y divide-line/70">
                {recentItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}`}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                      <ItemVisual item={item} iconClassName="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{item.title}</p>
                      <p className="truncate text-[10px] text-ink/40">
                        {item.owner?.full_name} · {item.location}
                      </p>
                    </div>
                    <TypeBadge type={item.type} className="!px-1.5 !py-0.5 text-[10px]" />
                    <StatusBadge status={item.status} className="!px-1.5 !py-0.5 text-[10px]" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'claims' && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            {CLAIM_TABS.map((option) => (
              <button
                key={option.value}
                onClick={() => setClaimFilter(option.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  claimFilter === option.value
                    ? 'border-ink bg-ink text-cream'
                    : 'border-line bg-paper text-ink/55 hover:border-ink/20 hover:text-ink',
                )}
              >
                {option.label}
                <span className="ml-1.5 text-[10px] opacity-60">
                  {option.value === 'all'
                    ? claims.length
                    : claims.filter((claim) => claim.status === option.value).length}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {visibleClaims.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={`No ${claimFilter === 'all' ? '' : claimFilter} claims`}
                body="Claims will appear here as soon as students submit proof for found items."
              />
            ) : (
              visibleClaims.map((claim) => (
                <div key={claim.id} className="card p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                        {claim.item ? (
                          <ItemVisual item={claim.item} iconClassName="h-6 w-6" />
                        ) : (
                          <div className="grid h-full w-full place-items-center bg-cream">
                            <FileText className="h-5 w-5 text-ink/30" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ClaimStatusBadge status={claim.status} />
                          <span className="text-[10px] text-ink/35">
                            {timeAgo(claim.created_at)}
                          </span>
                          {claim.item && <StatusBadge status={claim.item.status} />}
                        </div>
                        {claim.item ? (
                          <Link
                            to={`/items/${claim.item.id}`}
                            className="mt-1 block truncate font-display text-base font-bold tracking-tight hover:text-moss"
                          >
                            {claim.item.title}
                          </Link>
                        ) : (
                          <p className="mt-1 font-display text-base font-bold text-ink/40">
                            Removed listing
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-ink/45">
                          {claim.item?.location} ·{' '}
                          {claim.item ? formatDate(claim.item.event_date) : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl bg-cream/70 px-3 py-2.5 lg:w-56">
                      <Avatar name={claim.claimant?.full_name} />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-ink/35">
                          Claimant
                        </p>
                        <p className="truncate text-xs font-semibold">
                          {claim.claimant?.full_name || 'Unknown student'}
                        </p>
                      </div>
                    </div>

                    {claim.status === 'pending' && (
                      <div className="flex gap-2 lg:shrink-0">
                        <button
                          onClick={() => {
                            setReviewOpen(claim)
                            setReviewNote('')
                          }}
                          className="btn-primary !px-3.5 !py-2 text-xs"
                        >
                          Review claim
                        </button>
                      </div>
                    )}
                  </div>

                  <blockquote className="mt-3 rounded-xl border-l-2 border-gold bg-cream/50 px-3.5 py-2.5 text-xs leading-relaxed text-ink/65">
                    “{claim.message}”
                  </blockquote>

                  {claim.review_note && (
                    <p className="mt-2 text-[11px] text-ink/45">
                      <span className="font-semibold text-ink/55">Admin note:</span>{' '}
                      {claim.review_note}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'items' && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
              <input
                value={itemSearch}
                onChange={(event) => setItemSearch(event.target.value)}
                className="input pl-10"
                placeholder="Search reports by title, student or location…"
              />
            </div>
            <select
              value={itemType}
              onChange={(event) => setItemType(event.target.value)}
              className="input w-auto cursor-pointer"
            >
              <option value="all">All types</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
            <select
              value={itemStatus}
              onChange={(event) => setItemStatus(event.target.value)}
              className="input w-auto cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_review">Claim pending</option>
              <option value="resolved">Recovered</option>
            </select>
            <span className="text-xs text-ink/40">
              {pluralize(visibleItems.length, 'report')}
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {visibleItems.length === 0 ? (
              <EmptyState icon={Search} title="No reports match" body="Adjust the search or filters." />
            ) : (
              visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <Link
                    to={`/items/${item.id}`}
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                  >
                    <ItemVisual item={item} iconClassName="h-6 w-6" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <TypeBadge type={item.type} className="!px-2 !py-0.5" />
                      <StatusBadge status={item.status} className="!px-2 !py-0.5" />
                    </div>
                    <Link
                      to={`/items/${item.id}`}
                      className="mt-1 block truncate font-display text-base font-bold tracking-tight hover:text-moss"
                    >
                      {item.title}
                    </Link>
                    <p className="truncate text-[11px] text-ink/45">
                      {item.owner?.full_name} · {item.location} · {formatDate(item.event_date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                      to={`/items/${item.id}`}
                      className="btn-outline !px-3 !py-2 text-xs"
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="btn-ghost !px-2.5 !py-2 !text-coral hover:!bg-coral-soft"
                      title="Delete listing"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink/45">
              {pluralize(profiles.length, 'registered user')} · emails are visible only to
              admins through a protected RPC.
            </p>
            <span className="chip bg-cream text-ink/50">
              <ShieldCheck className="h-3 w-3" /> admins: {profiles.filter((p) => p.role === 'admin').length}
            </span>
          </div>

          <div className="card mt-4 overflow-hidden">
            <div className="hidden grid-cols-[1.4fr_1.6fr_0.7fr_0.7fr_0.7fr] gap-4 border-b border-line bg-cream/60 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-ink/40 md:grid">
              <span>Student</span>
              <span>Email</span>
              <span>Role</span>
              <span>Reports</span>
              <span>Joined</span>
            </div>
            <div className="divide-y divide-line/70">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="grid gap-2 px-4 py-3.5 md:grid-cols-[1.4fr_1.6fr_0.7fr_0.7fr_0.7fr] md:items-center md:gap-4 md:px-5"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={profile.full_name} />
                    <p className="truncate text-sm font-semibold">
                      {profile.full_name}
                      {profile.id === user?.id && (
                        <span className="ml-1.5 text-[10px] font-normal text-ink/35">(you)</span>
                      )}
                    </p>
                  </div>
                  <p className="truncate text-xs text-ink/50">{profile.email || '—'}</p>
                  <span
                    className={cn(
                      'chip w-fit',
                      profile.role === 'admin'
                        ? 'bg-gold-soft text-yellow-800'
                        : 'bg-moss-soft text-moss',
                    )}
                  >
                    {profile.role === 'admin' ? (
                      <>
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </>
                    ) : (
                      'Student'
                    )}
                  </span>
                  <p className="text-xs text-ink/50">{profile.report_count ?? 0}</p>
                  <p className="text-xs text-ink/40">{formatDate(profile.created_at)}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-ink/40">
            Roles are protected by a database trigger. To promote an administrator, run the
            SQL snippet in the project README from the Supabase SQL editor.
          </p>
        </div>
      )}

      <Modal
        open={Boolean(reviewOpen)}
        onClose={() => {
          if (!reviewWorking) {
            setReviewOpen(null)
            setReviewNote('')
          }
        }}
        title="Review ownership claim"
        description="Verify the evidence before approving. Approval is final and closes the listing."
        size="lg"
        footer={
          <>
            <button
              onClick={() => handleReview('rejected')}
              disabled={reviewWorking}
              className="btn-outline !text-coral hover:!bg-coral-soft/50"
            >
              {reviewWorking ? <Spinner className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              Reject claim
            </button>
            <button
              onClick={() => handleReview('approved')}
              disabled={reviewWorking}
              className="btn-primary"
            >
              {reviewWorking ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve &amp; mark recovered
            </button>
          </>
        }
      >
        {reviewOpen && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-cream/70 p-3.5">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                {reviewOpen.item ? (
                  <ItemVisual item={reviewOpen.item} iconClassName="h-6 w-6" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-sand">
                    <FileText className="h-5 w-5 text-ink/30" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold">
                  {reviewOpen.item?.title || 'Removed listing'}
                </p>
                <p className="text-[11px] text-ink/50">
                  {reviewOpen.item?.location} ·{' '}
                  {reviewOpen.item ? formatDate(reviewOpen.item.event_date) : '—'} · reported
                  by {reviewOpen.item?.owner?.full_name || 'unknown'}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink/45">
                  {reviewOpen.item?.description}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Avatar name={reviewOpen.claimant?.full_name} />
                <div>
                  <p className="text-sm font-semibold">
                    {reviewOpen.claimant?.full_name || 'Unknown student'}
                  </p>
                  <p className="text-[10px] text-ink/40">
                    Claim submitted {timeAgo(reviewOpen.created_at)}
                  </p>
                </div>
                <ClaimStatusBadge status={reviewOpen.status} className="ml-auto" />
              </div>
            </div>

            <blockquote className="rounded-xl border-l-2 border-gold bg-gold-soft/40 px-4 py-3 text-sm leading-relaxed text-ink/70">
              “{reviewOpen.message}”
            </blockquote>

            <div>
              <label htmlFor="review-note" className="label">
                Review note (optional, shared with the claimant)
              </label>
              <textarea
                id="review-note"
                rows={3}
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                className="input resize-none"
                placeholder="e.g. Serial number and photo matched the receipt."
                disabled={reviewWorking}
              />
            </div>

            <p className="rounded-xl bg-coral-soft/50 px-3.5 py-2.5 text-[11px] leading-relaxed text-coral">
              Approving marks the item recovered and automatically rejects every other pending
              claim for this listing. The claimant and the finder are both notified.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteItem}
        loading={deleteWorking}
        tone="coral"
        title="Delete this listing?"
        body={
          itemToDelete
            ? `"${itemToDelete.title}" and all of its claims will be permanently removed. Uploaded photos are cleaned up too.`
            : ''
        }
        confirmLabel="Delete listing"
      />
    </div>
  )
}
