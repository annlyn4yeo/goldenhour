import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  formatDuration,
  formatTime,
  getActiveWindow,
  getGoldenHourSchedule,
  getNextWindow,
} from './lib/goldenHour'

type Location = {
  lat: number
  lng: number
}

export default function App() {
  const [location, setLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => new Date())

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLoading(false)
      },
      () => {
        setError('Unable to get your location. Check permissions and try again.')
        setLoading(false)
      },
    )
  }, [])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const schedule = useMemo(() => {
    if (!location) return null
    return getGoldenHourSchedule(now, location.lat, location.lng)
  }, [location, now])

  const activeWindow = schedule ? getActiveWindow(schedule.windows, now) : null
  const nextWindow = schedule ? getNextWindow(schedule.windows, now) : null

  const status = activeWindow
    ? `${activeWindow.label} golden hour is happening now`
    : nextWindow
      ? `Next golden hour in ${formatDuration(nextWindow.start.getTime() - now.getTime())}`
      : 'No more golden hour today'

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 text-stone-900">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
        <header className="mb-10 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-700">
            Photography light tracker
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900">
            Golden Hour
          </h1>
          <p className="mt-3 text-stone-600">
            Find the best natural light for your next shoot.
          </p>
        </header>

        {loading && (
          <p className="rounded-2xl bg-white/70 px-5 py-4 text-center text-stone-600 shadow-sm backdrop-blur">
            Locating you...
          </p>
        )}

        {error && (
          <div className="space-y-4 rounded-2xl bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
            <p className="text-center text-red-700">{error}</p>
            <button
              type="button"
              onClick={requestLocation}
              className="w-full rounded-xl bg-amber-500 px-4 py-3 font-medium text-white transition hover:bg-amber-600"
            >
              Try again
            </button>
          </div>
        )}

        {schedule && location && (
          <div className="space-y-6">
            <section className="rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur">
              <p className="text-sm font-medium text-amber-700">Today</p>
              <p className="mt-2 text-lg font-medium text-stone-900">{status}</p>
              <p className="mt-1 text-sm text-stone-500">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            </section>

            <section className="grid gap-4">
              {schedule.windows.map((window) => {
                const isActive = activeWindow?.label === window.label

                return (
                  <article
                    key={window.label}
                    className={`rounded-3xl border p-5 shadow-sm backdrop-blur ${
                      isActive
                        ? 'border-amber-400 bg-amber-100/80'
                        : 'border-white/60 bg-white/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-stone-900">
                          {window.label}
                        </h2>
                        <p className="mt-1 text-stone-600">
                          {formatTime(window.start)} – {formatTime(window.end)}
                        </p>
                      </div>
                      {isActive && (
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                          Now
                        </span>
                      )}
                    </div>
                  </article>
                )
              })}
            </section>

            <button
              type="button"
              onClick={requestLocation}
              className="w-full rounded-xl border border-amber-200 bg-white/70 px-4 py-3 font-medium text-amber-900 transition hover:bg-white"
            >
              Refresh location
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
