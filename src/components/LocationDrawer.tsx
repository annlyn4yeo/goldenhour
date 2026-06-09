import { useState, type FormEvent } from 'react'
import { formatCoordinates, searchOpenMeteo } from '../lib/geocoding'
import type { SavedLocation } from '../hooks/useSavedLocations'

type LocationDrawerProps = {
  open: boolean
  locations: SavedLocation[]
  activeLocationId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onAdd: (location: Omit<SavedLocation, 'id' | 'addedAt'>) => void
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export default function LocationDrawer({
  open,
  locations,
  activeLocationId,
  onSelect,
  onRemove,
  onAdd,
}: LocationDrawerProps) {
  const [cityQuery, setCityQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = cityQuery.trim()
    if (trimmed.length < 2) {
      setError('Enter at least two characters.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const place = await searchOpenMeteo(trimmed)
      if (!place) {
        setError('No matching city found.')
        return
      }

      onAdd({
        name: place.name,
        lat: place.lat,
        lng: place.lng,
      })
      setCityQuery('')
    } catch {
      setError('Could not look up that city. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <aside
      aria-hidden={!open}
      className={`absolute top-0 right-0 z-40 flex h-full w-full flex-col border-l border-surface-border bg-surface-base pt-14 shadow-[-8px_0_24px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-in-out md:w-80 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-surface-border px-4">
        <h2 className="font-display text-title italic text-ink-primary">your locations</h2>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {locations.map((location) => {
          const isActive = location.id === activeLocationId

          return (
            <li key={location.id}>
              <div
                className={`flex items-stretch border-b border-surface-border transition-colors ${
                  isActive
                    ? 'border-l-[3px] border-l-sky-goldenHour bg-surface-muted'
                    : 'border-l-[3px] border-l-transparent'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(location.id)}
                  className="min-w-0 flex-1 px-4 py-3 text-left transition hover:bg-surface-muted/70"
                >
                  <span className="block truncate text-body font-medium text-ink-primary">
                    {location.name}
                  </span>
                  <span className="mt-0.5 block text-caption text-ink-secondary">
                    {formatCoordinates(location.lat, location.lng)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${location.name}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemove(location.id)
                  }}
                  className="shrink-0 px-3 text-ink-tertiary transition hover:text-ink-primary"
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="shrink-0 border-t border-surface-border bg-surface-card p-4"
      >
        <label className="block">
          <span className="mb-2 block text-caption font-medium text-ink-secondary">
            Add a city
          </span>
          <input
            type="search"
            value={cityQuery}
            onChange={(event) => setCityQuery(event.target.value)}
            placeholder="e.g. Paris, Tokyo"
            disabled={saving}
            className="w-full rounded-lg border border-surface-border bg-surface-base px-3 py-2.5 text-body text-ink-primary outline-none transition focus:border-sky-goldenHour focus:ring-2 focus:ring-sky-goldenHour/20 disabled:opacity-60"
          />
        </label>

        {error && <p className="mt-2 text-caption text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={saving || cityQuery.trim().length < 2}
          className="mt-3 w-full rounded-lg bg-sky-goldenHour px-4 py-2.5 text-body font-medium text-ink-inverse transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save location'}
        </button>
      </form>
    </aside>
  )
}
