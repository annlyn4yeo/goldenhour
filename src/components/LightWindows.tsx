import type { LightWindow } from '../lib/goldenHour'
import { formatDuration, formatTime, formatWindowRange } from '../lib/goldenHour'

type WindowGroupProps = {
  title: string
  accentClass: string
  activeBorderClass: string
  activeBgClass: string
  badgeClass: string
  windows: LightWindow[]
  activeWindowId: string | null
}

function WindowGroup({
  title,
  accentClass,
  activeBorderClass,
  activeBgClass,
  badgeClass,
  windows,
  activeWindowId,
}: WindowGroupProps) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
      <h2 className={`text-sm font-semibold uppercase tracking-[0.16em] ${accentClass}`}>
        {title}
      </h2>
      <div className="mt-4 space-y-3">
        {windows.map((window) => {
          const isActive = activeWindowId === window.id

          return (
            <article
              key={window.id}
              className={`rounded-2xl border px-4 py-3 ${
                isActive
                  ? `${activeBorderClass} ${activeBgClass}`
                  : 'border-transparent bg-white/60'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-stone-900">
                    {window.period === 'morning' ? 'Morning' : 'Evening'}
                  </p>
                  <p className="mt-1 text-stone-600">
                    {formatWindowRange(window.start, window.end)}
                  </p>
                </div>
                {isActive && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white ${badgeClass}`}
                  >
                    Now
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

type LightWindowsProps = {
  goldenHour: [LightWindow, LightWindow]
  blueHour: [LightWindow, LightWindow]
  solarNoon: Date
  daylightDurationMs: number
  sunrise: Date
  sunset: Date
  activeWindowId: string | null
  showHeading?: boolean
}

export default function LightWindows({
  goldenHour,
  blueHour,
  solarNoon,
  daylightDurationMs,
  sunrise,
  sunset,
  activeWindowId,
  showHeading = true,
}: LightWindowsProps) {
  return (
    <section className="space-y-4">
      {showHeading && (
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Today&apos;s light windows</h2>
          <p className="mt-1 text-sm text-stone-500">All times shown in your local timezone.</p>
        </div>
      )}

      <WindowGroup
        title="Golden hour"
        accentClass="text-amber-700"
        activeBorderClass="border-amber-400"
        activeBgClass="bg-amber-100/80"
        badgeClass="bg-amber-500"
        windows={goldenHour}
        activeWindowId={activeWindowId}
      />

      <WindowGroup
        title="Blue hour"
        accentClass="text-indigo-700"
        activeBorderClass="border-indigo-400"
        activeBgClass="bg-indigo-100/80"
        badgeClass="bg-indigo-500"
        windows={blueHour}
        activeWindowId={activeWindowId}
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-600">
            Solar noon
          </h2>
          <p className="mt-3 text-2xl font-semibold text-stone-900">
            {formatTime(solarNoon)}
          </p>
        </article>

        <article className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-600">
            Daylight
          </h2>
          <p className="mt-3 text-2xl font-semibold text-stone-900">
            {formatDuration(daylightDurationMs)}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {formatWindowRange(sunrise, sunset)}
          </p>
        </article>
      </section>
    </section>
  )
}
