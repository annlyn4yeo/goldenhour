import { useEffect, useState } from 'react'
import { searchCities, type Place } from '../lib/geocoding'

type CitySearchProps = {
  onSelect: (place: Place) => void
  disabled?: boolean
}

export default function CitySearch({ onSelect, disabled = false }: CitySearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setError(null)
      return
    }

    const timer = window.setTimeout(async () => {
      setSearching(true)
      setError(null)

      try {
        setResults(await searchCities(trimmed))
      } catch {
        setResults([])
        setError('City search failed. Try again in a moment.')
      } finally {
        setSearching(false)
      }
    }, 350)

    return () => window.clearTimeout(timer)
  }, [query])

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">
          Search for a city
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. Paris, Tokyo, Austin"
          disabled={disabled}
          className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:opacity-60"
        />
      </label>

      {searching && (
        <p className="text-sm text-stone-500">Searching...</p>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {!searching && query.trim().length >= 2 && results.length === 0 && !error && (
        <p className="text-sm text-stone-500">No cities found.</p>
      )}

      {results.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-amber-200 bg-white">
          {results.map((place) => (
            <li key={`${place.lat}-${place.lng}-${place.name}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(place)
                  setQuery('')
                  setResults([])
                }}
                className="flex w-full items-center justify-between gap-3 border-b border-amber-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-amber-50"
              >
                <span className="font-medium text-stone-900">{place.name}</span>
                <span className="text-sm text-stone-500">
                  {place.lat.toFixed(2)}, {place.lng.toFixed(2)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
