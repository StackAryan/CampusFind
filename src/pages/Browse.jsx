import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  Plus,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ItemCard from '../components/ItemCard'
import EmptyState from '../components/EmptyState'
import { ItemGridSkeleton } from '../components/Loading'
import { CATEGORY_VALUES, LOCATIONS } from '../lib/categories'
import { listItems, subscribeTable } from '../lib/api'
import { cn, pluralize } from '../lib/utils'

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input cursor-pointer appearance-none pr-9"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
        aria-hidden="true"
      />
    </label>
  )
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? 'all'
  const category = searchParams.get('category') ?? ''
  const location = searchParams.get('location') ?? ''
  const sort = searchParams.get('sort') ?? 'newest'
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const showRecovered = searchParams.get('recovered') === '1'
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(from || to))

  const load = useCallback(async () => {
    try {
      const data = await listItems()
      setError('')
      setItems(data)
    } catch (err) {
      setError(err.message || 'Could not load the board.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return subscribeTable('items', load)
  }, [load])

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'all' || (key === 'sort' && value === 'newest')) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }

  const toggleRecovered = () => {
    updateParam('recovered', showRecovered ? '' : '1')
  }

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
    setAdvancedOpen(false)
  }

  const activeFilterCount = [
    q,
    type !== 'all' ? type : '',
    category,
    location,
    from,
    to,
    showRecovered ? '1' : '',
  ].filter(Boolean).length

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const tokens = query ? query.split(/\s+/).filter(Boolean) : []

    return items
      .filter((item) => {
        if (!showRecovered && item.status === 'resolved') return false
        if (type !== 'all' && item.type !== type) return false
        if (category && item.category !== category) return false
        if (location && item.location !== location) return false
        if (from && item.event_date < from) return false
        if (to && item.event_date > to) return false
        if (tokens.length) {
          const haystack = `${item.title} ${item.description} ${item.category} ${item.location}`.toLowerCase()
          if (!tokens.every((token) => haystack.includes(token))) return false
        }
        return true
      })
      .sort((a, b) =>
        sort === 'oldest'
          ? new Date(a.created_at) - new Date(b.created_at)
          : new Date(b.created_at) - new Date(a.created_at),
      )
  }, [items, q, type, category, location, from, to, showRecovered, sort])

  const activeCount = items.filter((item) => item.status !== 'resolved').length

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Campus board"
        title="Browse lost & found"
        description={`${pluralize(activeCount, 'active report')} from across campus. Search it, filter it, and help something find its way home.`}
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

      <div className="mt-8 rounded-3xl border border-line bg-paper p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink/35" />
          <input
            value={q}
            onChange={(event) => updateParam('q', event.target.value)}
            className="input !py-3 pl-11 pr-10 text-[15px]"
            placeholder="Search by name, keyword, category or location…"
            aria-label="Search listings"
          />
          {q && (
            <button
              onClick={() => updateParam('q', '')}
              className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink/35 transition hover:bg-ink/5 hover:text-ink"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-line bg-cream p-1">
            {[
              { value: 'all', label: 'All' },
              { value: 'lost', label: 'Lost' },
              { value: 'found', label: 'Found' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateParam('type', option.value)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                  type === option.value
                    ? 'bg-ink text-cream shadow-sm'
                    : 'text-ink/55 hover:text-ink',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="min-w-36 flex-1 sm:max-w-52">
            <FilterSelect
              label="Category"
              value={category}
              onChange={(value) => updateParam('category', value)}
            >
              <option value="">All categories</option>
              {CATEGORY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </FilterSelect>
          </div>

          <div className="min-w-36 flex-1 sm:max-w-52">
            <FilterSelect
              label="Location"
              value={location}
              onChange={(value) => updateParam('location', value)}
            >
              <option value="">All locations</option>
              {LOCATIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </FilterSelect>
          </div>

          <div className="min-w-32 flex-1 sm:max-w-44">
            <FilterSelect
              label="Sort by"
              value={sort}
              onChange={(value) => updateParam('sort', value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </FilterSelect>
          </div>

          <button
            onClick={() => setAdvancedOpen((current) => !current)}
            className={cn(
              'btn-outline !px-3.5 !py-2.5 text-xs',
              advancedOpen && 'border-moss/40 bg-moss-soft/40 text-moss',
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Date &amp; status
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2 py-2 text-xs font-semibold text-coral hover:underline"
            >
              <X className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>

        {advancedOpen && (
          <div className="animate-rise mt-3 flex flex-wrap items-end gap-3 rounded-2xl bg-cream/70 px-3.5 py-3">
            <div>
              <label htmlFor="from-date" className="label !mb-1">
                Lost / found from
              </label>
              <input
                id="from-date"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => updateParam('from', event.target.value)}
                className="input !py-2 !text-xs"
              />
            </div>
            <div>
              <label htmlFor="to-date" className="label !mb-1">
                Until
              </label>
              <input
                id="to-date"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => updateParam('to', event.target.value)}
                className="input !py-2 !text-xs"
              />
            </div>
            <label className="mb-0.5 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-medium text-ink/65">
              <input
                type="checkbox"
                checked={showRecovered}
                onChange={toggleRecovered}
                className="h-4 w-4 accent-[#0e5f4e]"
              />
              Include recovered items
            </label>
            <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] text-ink/40">
              <CalendarDays className="h-3.5 w-3.5" />
              Dates filter the day the item was lost or found.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink/45">
          {loading ? 'Loading listings…' : `${pluralize(filtered.length, 'listing')} shown`}
        </p>
        <p className="hidden text-xs text-ink/35 sm:block">
          Tip: search a colour, a brand or a place you remember.
        </p>
      </div>

      <div className="mt-4">
        {loading ? (
          <ItemGridSkeleton />
        ) : error ? (
          <EmptyState
            icon={SearchX}
            title="The board could not load"
            body={error}
            action={
              <button onClick={load} className="btn-primary">
                Try again
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nothing matches that search"
            body="Try a broader keyword, a different location, or include recovered items. If the item is not here yet, post a report so others can find it."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="btn-outline">
                    Clear filters
                  </button>
                )}
                <Link to="/report" className="btn-primary">
                  <Plus className="h-4 w-4" /> Report an item
                </Link>
              </div>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
