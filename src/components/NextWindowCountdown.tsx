import {
  formatCountdown,
  getActiveWindow,
  getNextLightWindow,
  getNextWindowCountdownLabel,
  isValidSunTime,
  type LightSchedule,
} from '../lib/goldenHour'

type NextWindowCountdownProps = {
  schedule: LightSchedule
  now: Date
  lat: number
  lng: number
}

export default function NextWindowCountdown({
  schedule,
  now,
  lat,
  lng,
}: NextWindowCountdownProps) {
  const activeWindow = getActiveWindow(schedule.windows, now)
  const nextWindow = getNextLightWindow(schedule, now, lat, lng)

  if (!nextWindow || !isValidSunTime(nextWindow.start)) {
    return (
      <p className="text-sm text-stone-500">No upcoming light windows</p>
    )
  }

  const remainingMs = nextWindow.start.getTime() - now.getTime()
  const countdownLabel = getNextWindowCountdownLabel(nextWindow)

  return (
    <div className="mt-3">
      {activeWindow && (
        <p className="text-sm text-stone-600">
          {activeWindow.label} is happening now
        </p>
      )}
      <p
        className={`font-medium text-stone-900 ${activeWindow ? 'mt-2' : ''}`}
        aria-live="polite"
      >
        {countdownLabel}{' '}
        <span className="font-semibold tabular-nums text-amber-800">
          {formatCountdown(remainingMs)}
        </span>
      </p>
    </div>
  )
}
