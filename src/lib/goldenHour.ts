import SunCalc from 'suncalc'

export type LightWindow = {
  id: string
  category: 'goldenHour' | 'blueHour'
  period: 'morning' | 'evening'
  label: string
  start: Date
  end: Date
}

export type LightSchedule = {
  date: Date
  sunrise: Date
  sunset: Date
  solarNoon: Date
  daylightDurationMs: number
  goldenHour: {
    morning: LightWindow
    evening: LightWindow
  }
  blueHour: {
    morning: LightWindow
    evening: LightWindow
  }
  windows: LightWindow[]
}

let blueHourTimesConfigured = false

function ensureBlueHourTimes() {
  if (blueHourTimesConfigured) return
  SunCalc.addTime(-4, 'blueHourEnd', 'blueHourStart')
  blueHourTimesConfigured = true
}

function createWindow(
  category: LightWindow['category'],
  period: LightWindow['period'],
  start: Date,
  end: Date,
): LightWindow {
  const categoryLabel = category === 'goldenHour' ? 'Golden hour' : 'Blue hour'
  const periodLabel = period === 'morning' ? 'Morning' : 'Evening'

  return {
    id: `${category}-${period}`,
    category,
    period,
    label: `${categoryLabel} · ${periodLabel}`,
    start,
    end,
  }
}

export function getLightSchedule(
  date: Date,
  lat: number,
  lng: number,
): LightSchedule {
  ensureBlueHourTimes()
  const times = SunCalc.getTimes(date, lat, lng)

  const goldenHour = {
    morning: createWindow('goldenHour', 'morning', times.sunrise, times.goldenHour),
    evening: createWindow('goldenHour', 'evening', times.goldenHourEnd, times.sunset),
  }

  const blueHour = {
    morning: createWindow('blueHour', 'morning', times.dawn, times.blueHourEnd),
    evening: createWindow('blueHour', 'evening', times.blueHourStart, times.dusk),
  }

  const windows = [
    blueHour.morning,
    goldenHour.morning,
    goldenHour.evening,
    blueHour.evening,
  ]

  return {
    date,
    sunrise: times.sunrise,
    sunset: times.sunset,
    solarNoon: times.solarNoon,
    daylightDurationMs: times.sunset.getTime() - times.sunrise.getTime(),
    goldenHour,
    blueHour,
    windows,
  }
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function formatWindowRange(start: Date, end: Date): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function getActiveWindow(
  windows: LightWindow[],
  now = new Date(),
): LightWindow | null {
  return windows.find(({ start, end }) => now >= start && now <= end) ?? null
}

export function getNextWindow(
  windows: LightWindow[],
  now = new Date(),
): LightWindow | null {
  return windows.find(({ start }) => start > now) ?? null
}

export type ForecastDay = {
  date: Date
  dateKey: string
  dayLabel: string
  dateLabel: string
  schedule: LightSchedule
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfLocalDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(12, 0, 0, 0)
  return next
}

export function formatForecastDayLabel(date: Date, reference: Date): string {
  const referenceKey = toDateKey(reference)
  const dateKey = toDateKey(date)

  if (dateKey === referenceKey) return 'Today'

  const tomorrow = new Date(reference)
  tomorrow.setDate(reference.getDate() + 1)
  if (dateKey === toDateKey(tomorrow)) return 'Tomorrow'

  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
}

export function formatForecastDateLabel(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function getForecastDays(
  lat: number,
  lng: number,
  from = new Date(),
  count = 7,
): ForecastDay[] {
  const reference = startOfLocalDay(from)

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(reference)
    date.setDate(reference.getDate() + index)

    return {
      date,
      dateKey: toDateKey(date),
      dayLabel: formatForecastDayLabel(date, reference),
      dateLabel: formatForecastDateLabel(date),
      schedule: getLightSchedule(date, lat, lng),
    }
  })
}

export function isValidSunTime(date: Date): boolean {
  return !Number.isNaN(date.getTime())
}
