import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  SearchX,
  Sparkles,
  Trash2,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import ItemVisual from '../components/ItemVisual'
import { ClaimStatusBadge, StatusBadge, TypeBadge } from '../components/Badges'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { PageLoader } from '../components/Loading'
import { useAuth } from '../context/useAuth'
import {
  deleteItem,
  getMyClaims,
  listItems,
  subscribeTable,
  updateItem,
} from '../lib/api'
import { findMatches } from '../lib/matching'
import { firstName, formatDate, pluralize, timeAgo } from '../lib/utils'
import { toast } from '../lib/toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('reports')
  const [confirm, setConfirm] = useState(null)
  const [working, setWorking] = useState(false)

  const load = useCallback(async () => {
    try {
      const [allItems, myClaims] = await Promise.all([listItems(), getMyClaims()])
      setError('')
      setItems(allItems)
      setClaims(myClaims)
    } catch (err) {
      setError(err.message || 'Could not load your dashboard.')
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

  const myReports = useMemo(
    () =>
      items
        .filter((item) => item.user_id === user?.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [items, user],
  )

  const matchMap = useMemo(() => {
    const map = {}
    for (const report of myReports) {
      if (report.status === 'resolved') continue
      map[report.id] = findMatches(report, items, { limit: 50 })
    }
    return map
  }, [myReports, items])

  const totalMatches = useMemo(
    () => Object.values(matchMap).reduce((sum, matches) => sum + matches.length, 0),
    [matchMap],
  )

  const stats = useMemo(
    () => ({
      active: myReports.filter((report) => report.status !== 'resolved').length,
      recovered: myReports.filter((report) => report.status === 'resolved').length,
      pending: claims.filter((claim) => claim.status === 'pending').length,
      matches: totalMatches,
    }),
    [myReports, claims, totalMatches],
  )

  const handleConfirm = async () => {
    if (!confirm) return
    setWorking(true)
    try {
      if (confirm.action === 'delete') {
        await deleteItem(confirm.item.id)
        toast.success('Report deleted.')
      } else {
        await updateItem(confirm.item.id, { status: 'resolved' })
        toast.success('Item marked as recovered.')
      }
      setConfirm(null)
      await load()
    } catch (err) {
      toast.error(err.message || 'The action could not be completed.')
    } finally {
      setWorking(false)
    }
  }

  if (loading) return <PageLoader label="Loading your dashboard…" />

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={AlertCircle}
          title="Your dashboard could not load"
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
        eyebrow="Student dashboard"
        title={`Welcome back, ${firstName(user?.full_name)}`}
        description="Your reports, claims and potential matches in one place. Updates arrive live when an admin reviews a claim."
        actions={
          <>
            <Link to="/report?type=lost" className="btn-outline">
              <Plus className="h-4 w-4" /> Report lost
            </Link>
            <Link to="/report?type=found" className="btn-primary">
              <Plus className="h-4 w-4" /> Report found
            </Link>
          </>
        }
      />

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Active reports"
          value={stats.active}
          hint="Lost and found reports still open"
        />
        <StatCard
          icon={CheckCircle2}
          label="Recovered"
          value={stats.recovered}
          hint="Items you helped return"
          tone="ink"
        />
        <StatCard
          icon={Clock}
          label="Pending claims"
          value={stats.pending}
          hint="Waiting for admin review"
          tone="gold"
        />
        <StatCard
          icon={Sparkles}
          label="Potential matches"
          value={stats.matches}
          hint="Across your active reports"
          tone="coral"
        />
      </div>

      {totalMatches > 0 && (
        <Link
          to="/matches"
          className="group mt-4 flex flex-col gap-3 overflow-hidden rounded-2xl border border-moss/20 bg-moss-soft/50 px-4 py-3.5 transition hover:border-moss/35 hover:bg-moss-soft sm:flex-row sm:items-center"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-moss text-cream">
            <Sparkles className="h-4 w-4" />
          </span>
          <p className="flex-1 text-sm text-ink/70">
            <span className="font-bold text-ink">
              {pluralize(totalMatches, 'potential match', 'potential matches')}
            </span>{' '}
            found across your reports. See the score breakdown and open the matching listings.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-moss">
            View matches
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}

      <div className="mt-8 flex gap-1 border-b border-line">
        {[
          { value: 'reports', label: 'My reports', count: myReports.length },
          { value: 'claims', label: 'My claims', count: claims.length },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setTab(option.value)}
            className={`relative -mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-3 text-sm font-semibold transition ${
              tab === option.value
                ? 'border-moss text-ink'
                : 'border-transparent text-ink/45 hover:text-ink'
            }`}
          >
            {option.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                tab === option.value ? 'bg-moss-soft text-moss' : 'bg-ink/5 text-ink/40'
              }`}
            >
              {option.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'reports' ? (
          myReports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No reports yet"
              body="Post a lost or found item and it will appear here with its status and potential matches."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link to="/report?type=lost" className="btn-outline">
                    Report a lost item
                  </Link>
                  <Link to="/report?type=found" className="btn-primary">
                    Report a found item
                  </Link>
                </div>
              }
            />
          ) : (
            <div className="space-y-3">
              {myReports.map((report) => {
                const matches = matchMap[report.id] ?? []
                return (
                  <div
                    key={report.id}
                    className="card flex flex-col gap-4 p-4 transition hover:border-moss/25 sm:flex-row sm:items-center"
                  >
                    <Link
                      to={`/items/${report.id}`}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-16 sm:w-16"
                    >
                      <ItemVisual item={report} iconClassName="h-7 w-7" />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <TypeBadge type={report.type} className="!px-2 !py-0.5" />
                        <StatusBadge status={report.status} className="!px-2 !py-0.5" />
                        {matches.length > 0 && (
                          <Link
                            to="/matches"
                            className="chip bg-gold-soft !px-2 !py-0.5 text-yellow-800 hover:underline"
                          >
                            <Sparkles className="h-3 w-3" /> {matches.length} match
                            {matches.length === 1 ? '' : 'es'}
                          </Link>
                        )}
                      </div>
                      <Link
                        to={`/items/${report.id}`}
                        className="mt-1 block truncate font-display text-base font-bold tracking-tight hover:text-moss"
                      >
                        {report.title}
                      </Link>
                      <p className="mt-0.5 truncate text-[11px] text-ink/45">
                        {report.location} · {report.type === 'lost' ? 'Lost' : 'Found'}{' '}
                        {formatDate(report.event_date)} · posted {timeAgo(report.created_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Link
                        to={`/items/${report.id}`}
                        className="btn-outline !px-3 !py-2 text-xs"
                      >
                        View
                      </Link>
                      {report.status === 'open' && (
                        <button
                          onClick={() => setConfirm({ action: 'resolve', item: report })}
                          className="btn-ghost !px-2.5 !py-2 text-xs !text-moss hover:!bg-moss-soft"
                          title="Mark as recovered"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirm({ action: 'delete', item: report })}
                        className="btn-ghost !px-2.5 !py-2 !text-coral hover:!bg-coral-soft"
                        title="Delete report"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : claims.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No claims submitted"
            body="Found a listing that belongs to you? Open it and submit a claim with proof. You will see its review status here."
            action={
              <Link to="/browse" className="btn-primary">
                Browse listings
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="card p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {claim.item ? (
                    <Link
                      to={`/items/${claim.item.id}`}
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl"
                    >
                      <ItemVisual item={claim.item} iconClassName="h-7 w-7" />
                    </Link>
                  ) : (
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cream text-ink/30">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ClaimStatusBadge status={claim.status} />
                      <span className="text-[11px] text-ink/35">
                        submitted {timeAgo(claim.created_at)}
                      </span>
                    </div>
                    <Link
                      to={claim.item ? `/items/${claim.item.id}` : '/browse'}
                      className="mt-1 block font-display text-base font-bold tracking-tight hover:text-moss"
                    >
                      {claim.item?.title || 'Listing removed'}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink/50">
                      “{claim.message}”
                    </p>

                    {claim.status === 'pending' && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gold-soft/60 px-2.5 py-1.5 text-[11px] text-yellow-900">
                        <Clock className="h-3 w-3" /> Waiting for an admin to verify ownership.
                      </p>
                    )}
                    {claim.status === 'approved' && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-moss-soft px-2.5 py-1.5 text-[11px] text-moss">
                        <CheckCircle2 className="h-3 w-3" /> Approved — the item has been marked
                        recovered.
                      </p>
                    )}
                    {claim.status === 'rejected' && claim.review_note && (
                      <p className="mt-2 rounded-lg bg-coral-soft/60 px-2.5 py-1.5 text-[11px] leading-relaxed text-coral">
                        Admin note: {claim.review_note}
                      </p>
                    )}
                  </div>

                  {claim.item && (
                    <Link
                      to={`/items/${claim.item.id}`}
                      className="btn-outline shrink-0 !px-3 !py-2 text-xs"
                    >
                      View item
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
        loading={working}
        tone={confirm?.action === 'delete' ? 'coral' : 'primary'}
        title={
          confirm?.action === 'delete' ? 'Delete this report?' : 'Mark as recovered?'
        }
        body={
          confirm?.action === 'delete'
            ? 'This permanently removes the listing and any claims attached to it. This cannot be undone.'
            : 'This closes the report and removes it from active listings. Use it when you already have the item back.'
        }
        confirmLabel={confirm?.action === 'delete' ? 'Delete report' : 'Mark recovered'}
      />
    </div>
  )
}
