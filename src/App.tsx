import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import CitySearch from './components/CitySearch'
import {
  formatCoordinates,
  reverseGeocode,
  type Place,
} from './lib/geocoding'
import ForecastStrip from './components/ForecastStrip'
import SunArcRing from './components/SunArcRing'
import {
  formatDuration,
  getActiveWindow,
  getLightSchedule,
  getNextWindow,
  getTimeOfDayPhase,
  TIME_OF_DAY_BACKGROUNDS,
} from './lib/goldenHour'

type Location = Place & {
  source: 'geolocation' | 'search'
}

export default function App() {
  const [location, setLocation] = useState<Location | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [detecting, setDetecting] = useState(true)
  const [resolvingPlace, setResolvingPlace] = useState(false)
  const [now, setNow] = useState(() => new Date())

  const applyCoordinates = useCallback(
    async (lat: number, lng: number, source: Location['source'], name?: string) => {
      setResolvingPlace(true)
      setGeoError(null)

      try {
        const place = name ? { lat, lng, name } : await reverseGeocode(lat, lng)
        setLocation({ ...place, source })
      } catch {
        setLocation({
          lat,
          lng,
          name: 'Unknown location',
          source,
        })
      } finally {
        setResolvingPlace(false)
        setDetecting(false)
      }
    },
    [],
  )

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported in this browser.')
      setDetecting(false)
      return
    }

    setDetecting(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void applyCoordinates(
          position.coords.latitude,
          position.coords.longitude,
          'geolocation',
        )
      },
      () => {
        setGeoError('Unable to detect your location. Search for a city below.')
        setDetecting(false)
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    )
  }, [applyCoordinates])

  useEffect(() => {
    detectLocation()
  }, [detectLocation])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const schedule = useMemo(() => {
    if (!location) return null
    return getLightSchedule(now, location.lat, location.lng)
  }, [location, now])

  const activeWindow = schedule ? getActiveWindow(schedule.windows, now) : null
  const nextWindow = schedule ? getNextWindow(schedule.windows, now) : null
  const timeOfDayPhase = schedule ? getTimeOfDayPhase(schedule, now) : 'daytime'
  const background = TIME_OF_DAY_BACKGROUNDS[timeOfDayPhase]

  const status = activeWindow
    ? `${activeWindow.label} is happening now`
    : nextWindow
      ? `${nextWindow.label} in ${formatDuration(nextWindow.start.getTime() - now.getTime())}`
      : 'No more light windows today'

  const handleCitySelect = (place: Place) => {
    void applyCoordinates(place.lat, place.lng, 'search', place.name)
  }

  const showFallback = Boolean(geoError) && !location
  const showSchedule = Boolean(schedule && location)

  return (
    <div
      className="time-of-day-bg min-h-screen text-stone-900"
      style={
        {
          '--bg-from': background.from,
          '--bg-via': background.via,
          '--bg-to': background.to,
        } as CSSProperties
      }
    >
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

        {(detecting || resolvingPlace) && (
          <p className="mb-6 rounded-2xl bg-white/70 px-5 py-4 text-center text-stone-600 shadow-sm backdrop-blur">
            {detecting ? 'Detecting your location...' : 'Looking up city name...'}
          </p>
        )}

        {geoError && (
          <div className="mb-6 rounded-2xl bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
            <p className="text-center text-red-700">{geoError}</p>
            <button
              type="button"
              onClick={detectLocation}
              className="mt-4 w-full rounded-xl bg-amber-500 px-4 py-3 font-medium text-white transition hover:bg-amber-600"
            >
              Try auto-detect again
            </button>
          </div>
        )}

        {(showFallback || !location) && !detecting && (
          <section className="mb-6 rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur">
            <CitySearch onSelect={handleCitySelect} disabled={resolvingPlace} />
          </section>
        )}

        {showSchedule && location && schedule && (
          <div className="space-y-6">
            <section className="rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur">
              <p className="text-sm font-medium text-amber-700">Today</p>
              <p className="mt-2 text-lg font-medium text-stone-900">{status}</p>
              <div className="mt-4 rounded-2xl bg-amber-50/80 px-4 py-3">
                <p className="text-base font-semibold text-stone-900">{location.name}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {formatCoordinates(location.lat, location.lng)}
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur">
              <p className="text-sm font-medium text-amber-700">Sun path today</p>
              <p className="mt-1 text-sm text-stone-500">
                Live position from sunrise to sunset. Golden segments mark golden hour.
              </p>
              <div className="mt-5">
                <SunArcRing schedule={schedule} />
              </div>
            </section>

            <ForecastStrip
              lat={location.lat}
              lng={location.lng}
              now={now}
            />

            <section className="rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-stone-700">Change location</p>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={detecting || resolvingPlace}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                >
                  Use my location
                </button>
              </div>
              <CitySearch onSelect={handleCitySelect} disabled={resolvingPlace} />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
