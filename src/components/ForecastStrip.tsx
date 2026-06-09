import { useMemo, useState } from 'react'
import {
  formatWindowRange,
  getActiveWindow,
  getForecastDays,
  isValidSunTime,
  toDateKey,
  type ForecastDay,
} from '../lib/goldenHour'
import LightWindows from './LightWindows'

type ForecastStripProps = {
  lat: number
  lng: number
  now: Date
}

function GoldenHourSummary({ day }: { day: ForecastDay }) {
  const { morning, evening } = day.schedule.goldenHour

  if (!isValidSunTime(morning.start) || !isValidSunTime(evening.end)) {
    return <p className="mt-3 text-sm text-stone-500">No golden hour</p>
  }

  return (
    <div className="mt-3 space-y-1 text-sm text-stone-600">
      <p>
        <span className="font-medium text-stone-700">AM</span>{' '}
        {formatWindowRange(morning.start, morning.end)}
      </p>
      <p>
        <span className="font-medium text-stone-700">PM</span>{' '}
        {formatWindowRange(evening.start, evening.end)}
      </p>
    </div>
  )
}

export default function ForecastStrip({ lat, lng, now }: ForecastStripProps) {
  const forecast = useMemo(
    () => getForecastDays(lat, lng, now),
    [lat, lng, now],
  )
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(now))

  const selectedDay =
    forecast.find((day) => day.dateKey === selectedDateKey) ?? forecast[0]

  const isToday = selectedDay.dateKey === toDateKey(now)
  const activeWindowId = isToday
    ? getActiveWindow(selectedDay.schedule.windows, now)?.id ?? null
    : null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">7-day forecast</h2>
        <p className="mt-1 text-sm text-stone-500">
          Golden hour times for the week ahead. Tap a day for full details.
        </p>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-min snap-x snap-mandatory gap-3">
          {forecast.map((day) => {
            const isSelected = day.dateKey === selectedDay.dateKey

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDateKey(day.dateKey)}
                aria-pressed={isSelected}
                className={`w-36 shrink-0 snap-start rounded-3xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-amber-400 bg-amber-100/90 shadow-sm'
                    : 'border-white/60 bg-white/70 hover:bg-white'
                }`}
              >
                <p className="text-sm font-semibold text-stone-900">{day.dayLabel}</p>
                <p className="text-xs text-stone-500">{day.dateLabel}</p>
                <GoldenHourSummary day={day} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-3xl bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="mb-4">
          <p className="text-sm font-medium text-amber-700">
            {selectedDay.dayLabel} · {selectedDay.dateLabel}
          </p>
        </div>

        <LightWindows
          goldenHour={[
            selectedDay.schedule.goldenHour.morning,
            selectedDay.schedule.goldenHour.evening,
          ]}
          blueHour={[
            selectedDay.schedule.blueHour.morning,
            selectedDay.schedule.blueHour.evening,
          ]}
          solarNoon={selectedDay.schedule.solarNoon}
          daylightDurationMs={selectedDay.schedule.daylightDurationMs}
          sunrise={selectedDay.schedule.sunrise}
          sunset={selectedDay.schedule.sunset}
          activeWindowId={activeWindowId}
          showHeading={false}
        />
      </div>
    </section>
  )
}
