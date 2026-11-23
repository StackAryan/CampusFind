import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ScanSearch,
  Sparkles,
  Target,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ItemVisual from '../components/ItemVisual'
import { StatusBadge, TypeBadge } from '../components/Badges'
import MatchCard from '../components/MatchCard'
import EmptyState from '../components/EmptyState'
import { PageLoader } from '../components/Loading'
import { useAuth } from '../context/useAuth'
import { listItems, subscribeTable } from '../lib/api'
import { findMatches, MATCH_THRESHOLD, MATCH_WEIGHTS } from '../lib/matching'
import { formatDate, pluralize } from '../lib/utils'

const weights = [
  {
    label: 'Category',
    points: MATCH_WEIGHTS.category,
    description: 'Both reports name the same category.',
  },
  {
    label: 'Keywords',
    points: MATCH_WEIGHTS.keywords,
    description: 'Shared words from titles and descriptions, ignoring filler words.',
  },
  {
    label: 'Location',
    points: MATCH_WEIGHTS.location,
    description: 'Exact campus location scores highest; nearby locations score partially.',
  },
  {
    label: 'Date',
    points: MATCH_WEIGHTS.date,
    description: 'Closer lost and found dates earn more points.',
  },
]

export default function Matches() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await listItems()
      setError('')
      setItems(data)
    } catch (err) {
      setError(err.message || 'Could not load potential matches.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return subscribeTable('items', load)
  }, [load])

  const groups = useMemo(() => {
    const reports = items
      .filter((item) => item.user_id === user?.id && item.status !== 'resolved')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return reports
      .map((report) => ({
        report,
        matches: findMatches(report, items, { limit: 6 }),
      }))
      .filter((group) => group.matches.length > 0)
  }, [items, user])

  const totalMatches = groups.reduce((sum, group) => sum + group.matches.length, 0)
  const activeReports = items.filter(
    (item) => item.user_id === user?.id && item.status !== 'resolved',
  )

  if (loading) return <PageLoader label="Looking for matches…" />

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={AlertCircle}
          title="Matches could not load"
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
        eyebrow="Smart matching"
        title="Potential matches"
        description="Live comparisons between your reports and the rest of the board. Every score shows exactly where its points came from."
        actions={
          <Link to="/dashboard" className="btn-outline">
            Back to dashboard
          </Link>
        }
      />

      {activeReports.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={ScanSearch}
            title="Nothing to match yet"
            body="You have no active reports. Post a lost or found item and the matching engine will start comparing it with the board."
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
        </div>
      ) : groups.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Target}
            title="No matches right now"
            body="We checked category, keywords, location and date against every open report. Nothing crossed the threshold yet — matches appear here automatically as new reports arrive."
            action={
              <Link to="/browse" className="btn-primary">
                Explore the board
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-moss/20 bg-moss-soft/50 px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-moss text-cream">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-sm text-ink/65">
              <span className="font-bold text-ink">
                {pluralize(totalMatches, 'match', 'matches')}
              </span>{' '}
              across {pluralize(groups.length, 'of your reports')}. Scores of 75+ are strong;
              40–74 are worth checking.
            </p>
          </div>

          <div className="mt-7 space-y-8">
            {groups.map(({ report, matches }) => (
              <section key={report.id}>
                <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <Link
                    to={`/items/${report.id}`}
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                  >
                    <ItemVisual item={report} iconClassName="h-6 w-6" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <TypeBadge type={report.type} className="!px-2 !py-0.5" />
                      <StatusBadge status={report.status} className="!px-2 !py-0.5" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/35">
                        your report
                      </span>
                    </div>
                    <Link
                      to={`/items/${report.id}`}
                      className="mt-1 block truncate font-display text-lg font-bold tracking-tight hover:text-moss"
                    >
                      {report.title}
                    </Link>
                    <p className="text-[11px] text-ink/45">
                      {report.location} · {formatDate(report.event_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:text-right">
                    <div>
                      <p className="font-display text-2xl font-extrabold text-moss">
                        {matches.length}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-ink/35">
                        match{matches.length === 1 ? '' : 'es'}
                      </p>
                    </div>
                    <Link
                      to={`/items/${report.id}`}
                      className="btn-outline !px-3 !py-2 text-xs"
                    >
                      Open <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {matches.map((match) => (
                    <MatchCard key={match.item.id} match={match} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <section id="how-matching-works" className="mt-12">
        <div className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="lg:w-1/2">
              <span className="chip bg-gold-soft text-yellow-800">
                <Sparkles className="h-3 w-3" /> Transparent by design
              </span>
              <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight">
                How the match score works
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/55">
                The engine compares every open lost report with every open found report. Four
                signals are added to produce a score out of 100. There is no machine learning
                — just a weighted formula you can audit and explain.
              </p>

              <div className="mt-5 space-y-3">
                {weights.map((weight) => (
                  <div key={weight.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink/70">{weight.label}</span>
                      <span className="font-bold text-moss">{weight.points} pts</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cream">
                      <div
                        className="h-full rounded-full bg-moss"
                        style={{ width: `${weight.points}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-ink/40">
                      {weight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 lg:w-1/2">
              <div className="rounded-2xl bg-cream/70 p-5">
                <h3 className="flex items-center gap-2 font-display text-base font-bold">
                  <Target className="h-4 w-4 text-moss" /> When a match is shown
                </h3>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink/60">
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
                    The pair scores at least <strong>{MATCH_THRESHOLD} points</strong>.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
                    They share a category <em>or</em> at least three meaningful keywords.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
                    One is lost, one is found, both are unresolved, and they belong to
                    different students.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
                    Similar locations are handled with partial credit; filler words and
                    generic words like “lost” or “found” are ignored.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-gold-soft/60 p-5">
                <h3 className="flex items-center gap-2 font-display text-base font-bold">
                  <Sparkles className="h-4 w-4 text-yellow-800" /> Score labels
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-ink/65">
                  <li className="flex items-center justify-between">
                    <span>75–100 · Strong match</span>
                    <span className="chip bg-moss-soft text-moss">check now</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>55–74 · Possible match</span>
                    <span className="chip bg-gold-soft text-yellow-800">worth a look</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>40–54 · Worth checking</span>
                    <span className="chip bg-cream text-ink/50">low confidence</span>
                  </li>
                </ul>
                <p className="mt-3 text-[10px] leading-relaxed text-ink/40">
                  Matching never replaces verification. If you recognise an item, submit a
                  claim and let an admin confirm ownership.
                </p>
              </div>

              <Link
                to="/browse"
                className="inline-flex items-center gap-1.5 px-1 text-xs font-semibold text-moss hover:underline"
              >
                Search the full board <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
