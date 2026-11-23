import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Lightbulb,
  MapPin,
  Package,
  Search,
  Sparkles,
  Tag,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import MatchCard from '../components/MatchCard'
import PhotoUpload from '../components/PhotoUpload'
import { Spinner } from '../components/Loading'
import { useAuth } from '../context/useAuth'
import { CATEGORY_VALUES, LOCATIONS } from '../lib/categories'
import { createItem, listItems } from '../lib/api'
import { findMatches } from '../lib/matching'
import { todayISO } from '../lib/utils'
import { toast } from '../lib/toast'

const TYPE_CARDS = {
  lost: {
    label: 'I lost something',
    description: 'Tell the campus what disappeared so a finder can match it.',
    icon: Search,
    selected: 'border-coral bg-coral-soft/60 ring-1 ring-coral/20',
    iconClass: 'bg-coral-soft text-coral',
  },
  found: {
    label: 'I found something',
    description: 'Post what you picked up and keep the proof details private.',
    icon: Package,
    selected: 'border-moss bg-moss-soft/60 ring-1 ring-moss/20',
    iconClass: 'bg-moss-soft text-moss',
  },
}

function FieldError({ children }) {
  if (!children) return null
  return <p className="mt-1 text-xs font-medium text-coral">{children}</p>
}

export default function Report() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const type = searchParams.get('type') === 'found' ? 'found' : 'lost'
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState(todayISO())
  const [imageFile, setImageFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [items, setItems] = useState([])

  useEffect(() => {
    let active = true
    listItems()
      .then((data) => {
        if (active) setItems(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const today = todayISO()

  const previewItem = useMemo(
    () => ({
      id: 'preview',
      user_id: user?.id,
      type,
      title,
      description,
      category,
      location,
      event_date: eventDate,
      status: 'open',
    }),
    [user, type, title, description, category, location, eventDate],
  )

  const previewMatches = useMemo(() => {
    if (category === '' && title.trim().length < 3) return []
    return findMatches(previewItem, items, { limit: 3 })
  }, [previewItem, items, category, title])

  const validate = () => {
    const next = {}
    if (title.trim().length < 3) next.title = 'Give the item a short, clear name (3+ characters).'
    if (!category) next.category = 'Choose the closest category.'
    if (!location) next.location = 'Choose where it was lost or found.'
    if (!eventDate) {
      next.eventDate = 'Pick the date it was lost or found.'
    } else if (eventDate > today) {
      next.eventDate = 'The date cannot be in the future.'
    }
    if (description.trim().length < 10) {
      next.description = 'Add at least 10 characters so others can recognise the item.'
    }
    return next
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Please fix the highlighted fields before posting.')
      return
    }

    setSubmitting(true)
    try {
      const item = await createItem({
        type,
        title,
        category,
        description,
        location,
        event_date: eventDate,
        imageFile,
      })
      toast.success(
        type === 'lost'
          ? 'Lost report posted. Check your matches from the dashboard.'
          : 'Found report posted. Thanks for helping someone out.',
      )
      navigate(`/items/${item.id}`)
    } catch (error) {
      setFormError(error.message || 'Could not post the report. Please try again.')
      toast.error(error.message || 'Could not post the report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to="/browse"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/45 transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to the board
      </Link>

      <div className="mt-4">
        <PageHeader
          eyebrow="New report"
          title={type === 'lost' ? 'Report a lost item' : 'Report a found item'}
          description={
            type === 'lost'
              ? 'The more detail you add, the easier it is for the match engine and other students to find it.'
              : 'Post what you found, but keep one unique detail out of the public description so you can check claims.'
          }
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(TYPE_CARDS).map(([value, card]) => {
              const Icon = card.icon
              const selected = type === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSearchParams({ type: value }, { replace: true })}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    selected
                      ? card.selected
                      : 'border-line bg-paper hover:border-ink/20 hover:bg-white'
                  }`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${card.iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{card.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-ink/50">
                      {card.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="card space-y-6 p-5 sm:p-7" noValidate>
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">Item details</h2>
              <p className="mt-0.5 text-xs text-ink/45">
                This information is visible to signed-in students.
              </p>
            </div>

            <div>
              <label htmlFor="title" className="label">
                Item name
              </label>
              <input
                id="title"
                className="input"
                placeholder={type === 'lost' ? 'e.g. Black wireless earbuds' : 'e.g. Blue Hydro Flask'}
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                disabled={submitting}
              />
              <div className="flex items-start justify-between gap-3">
                <FieldError>{errors.title}</FieldError>
                <span className="ml-auto mt-1 text-[10px] text-ink/30">{title.length}/120</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="label">
                  Category
                </label>
                <select
                  id="category"
                  className="input cursor-pointer"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  disabled={submitting}
                >
                  <option value="">Choose a category…</option>
                  {CATEGORY_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <FieldError>{errors.category}</FieldError>
              </div>
              <div>
                <label htmlFor="location" className="label">
                  {type === 'lost' ? 'Last seen location' : 'Where you found it'}
                </label>
                <select
                  id="location"
                  className="input cursor-pointer"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  disabled={submitting}
                >
                  <option value="">Choose a campus location…</option>
                  {LOCATIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <FieldError>{errors.location}</FieldError>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea
                id="description"
                rows={5}
                className="input resize-none leading-relaxed"
                placeholder={
                  type === 'lost'
                    ? 'Colour, brand, contents, stickers, distinguishing marks — anything a finder might recognise.'
                    : 'Describe the item publicly. Leave out one unique detail so you can verify the owner.'
                }
                value={description}
                maxLength={2000}
                onChange={(event) => setDescription(event.target.value)}
                disabled={submitting}
              />
              <div className="flex items-start justify-between gap-3">
                <FieldError>{errors.description}</FieldError>
                <span className="ml-auto mt-1 text-[10px] text-ink/30">
                  {description.length}/2000
                </span>
              </div>
            </div>

            <div className="border-t border-line pt-6">
              <h2 className="font-display text-lg font-bold tracking-tight">Where &amp; when</h2>
              <p className="mt-0.5 text-xs text-ink/45">
                Date proximity is one of the four signals used by the match engine.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="eventDate" className="label">
                  {type === 'lost' ? 'Date last seen' : 'Date found'}
                </label>
                <input
                  id="eventDate"
                  type="date"
                  max={today}
                  className="input"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  disabled={submitting}
                />
                <FieldError>{errors.eventDate}</FieldError>
              </div>
              <div className="rounded-xl bg-cream/70 px-3.5 py-3 text-xs leading-relaxed text-ink/50">
                <span className="flex items-center gap-1.5 font-semibold text-ink/65">
                  <MapPin className="h-3.5 w-3.5 text-moss" /> Pick the closest area
                </span>
                <p className="mt-1">
                  Specific buildings help matches score higher than a vague “somewhere on
                  campus”.
                </p>
              </div>
            </div>

            <div className="border-t border-line pt-6">
              <h2 className="font-display text-lg font-bold tracking-tight">Photo</h2>
              <p className="mb-3 mt-0.5 text-xs text-ink/45">
                A photo makes recognition much faster, but it is optional.
              </p>
              <PhotoUpload file={imageFile} onChange={setImageFile} disabled={submitting} />
            </div>

            {formError && (
              <p className="flex items-start gap-2 rounded-xl bg-coral-soft px-3.5 py-2.5 text-xs font-medium text-coral">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {formError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <p className="text-[11px] text-ink/40">
                Posting as <span className="font-semibold text-ink/60">{user?.full_name}</span>
              </p>
              <div className="flex gap-2">
                <Link to="/browse" className="btn-outline">
                  Cancel
                </Link>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting && <Spinner className="h-4 w-4" />}
                  {submitting
                    ? 'Posting…'
                    : type === 'lost'
                      ? 'Post lost report'
                      : 'Post found report'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-soft text-yellow-800">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold tracking-tight">Smart check</h2>
                <p className="text-[10px] text-ink/40">Live potential matches as you type</p>
              </div>
            </div>

            <div className="mt-4">
              {previewMatches.length > 0 ? (
                <div className="space-y-2.5">
                  <p className="text-xs leading-relaxed text-ink/55">
                    <span className="font-semibold text-ink">{previewMatches.length}</span>{' '}
                    possible {previewMatches.length === 1 ? 'match' : 'matches'} found on the
                    board. Open one in a new tab to compare before posting.
                  </p>
                  {previewMatches.map((match) => (
                    <MatchCard key={match.item.id} match={match} compact newTab />
                  ))}
                </div>
              ) : category || title.trim().length >= 3 ? (
                <div className="rounded-xl bg-cream/70 px-3.5 py-4 text-center">
                  <p className="text-xs font-semibold text-ink/60">No potential matches yet</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink/40">
                    That is okay — your report will still be searchable, and new matches can
                    appear later. Add a category and location for better scoring.
                  </p>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-ink/50">
                  Start with a name and category. We will compare category, keywords, location
                  and date against open reports — and show you the score breakdown.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-gold-soft/70 p-5">
            <div className="flex items-center gap-2 text-yellow-900">
              <Lightbulb className="h-4 w-4" />
              <h2 className="font-display text-base font-bold tracking-tight">
                Better reports get found
              </h2>
            </div>
            <ul className="mt-3 space-y-2.5 text-[11px] leading-relaxed text-ink/60">
              <li className="flex gap-2">
                <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-800" />
                Use a specific title — “black wireless earbuds” beats “earphones”.
              </li>
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-800" />
                Pick the exact building or lot; location contributes 20 points.
              </li>
              <li className="flex gap-2">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-800" />
                Report the date accurately. Nearby dates score higher.
              </li>
              <li className="flex gap-2">
                <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-800" />
                Mention colour, brand, stickers and contents — but keep one proof detail
                private if you are the finder.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-line bg-paper p-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/40">
              Match weights
            </h2>
            <ul className="mt-3 space-y-2 text-xs text-ink/55">
              {[
                ['Category', '30 pts'],
                ['Keywords', '35 pts'],
                ['Location', '20 pts'],
                ['Date', '15 pts'],
              ].map(([label, points]) => (
                <li key={label} className="flex items-center justify-between">
                  <span>{label}</span>
                  <span className="font-semibold text-moss">{points}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] leading-relaxed text-ink/35">
              A pair needs 40+ points and either the same category or three shared keywords.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
