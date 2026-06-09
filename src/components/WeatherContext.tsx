import type { WeatherSnapshot } from '../lib/weather'

type WeatherContextProps = {
  weather: WeatherSnapshot | null
  loading: boolean
  error: string | null
}

export default function WeatherContext({
  weather,
  loading,
  error,
}: WeatherContextProps) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-stone-900/5 px-4 py-3">
        <p className="text-sm text-stone-600">Loading current weather…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
        <p className="text-sm font-medium text-amber-900">Weather unavailable</p>
        <p className="mt-1 text-sm text-amber-800">{error}</p>
      </div>
    )
  }

  if (!weather) return null

  return (
    <div className="rounded-2xl bg-stone-900/5 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-700">Current skies</p>
          <p className="mt-1 text-base font-semibold text-stone-900">
            {weather.label}
          </p>
        </div>
        {weather.temperatureC !== null && (
          <p className="text-sm font-medium text-stone-600">
            {Math.round(weather.temperatureC)}°C
          </p>
        )}
      </div>
      <p className="mt-2 text-sm leading-6 text-stone-600">{weather.description}</p>
      {weather.cloudCover !== null && (
        <p className="mt-2 text-xs text-stone-500">
          Cloud cover {weather.cloudCover}%
        </p>
      )}
    </div>
  )
}
