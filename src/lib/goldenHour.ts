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
  dawn: Date
  dusk: Date
  nightEnd: Date
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

export type TimeOfDayPhase = 'dawn' | 'goldenHour' | 'blueHour' | 'daytime' | 'night'

export type TimeOfDayBackground = {
  from: string
  via: string
  to: string
}

export const TIME_OF_DAY_BACKGROUNDS: Record<TimeOfDayPhase, TimeOfDayBackground> = {
  goldenHour: { from: '#fffbeb', via: '#fde68a', to: '#fed7aa' },
  blueHour: { from: '#eef2ff', via: '#c7d2fe', to: '#a5b4fc' },
  dawn: { from: '#faf5ff', via: '#f3e8ff', to: '#ede9fe' },
  daytime: { from: '#f8fafc', via: '#fffbeb', to: '#ecfdf5' },
  night: { from: '#f1f5f9', via: '#e2e8f0', to: '#cbd5e1' },
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
    dawn: times.dawn,
    dusk: times.dusk,
    nightEnd: times.nightEnd,
    solarNoon: times.solarNoon,
    daylightDurationMs: times.sunset.getTime() - times.sunrise.getTime(),
    goldenHour,
    blueHour,
    windows,
  }
}

export function getTimeOfDayPhase(
  schedule: LightSchedule,
  now = new Date(),
): TimeOfDayPhase {
  const active = getActiveWindow(schedule.windows, now)
  if (active) {
    return active.category === 'goldenHour' ? 'goldenHour' : 'blueHour'
  }

  if (now >= schedule.nightEnd && now < schedule.sunrise) {
    return 'dawn'
  }

  if (now >= schedule.sunrise && now < schedule.sunset) {
    return 'daytime'
  }

  return 'night'
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
  return (
    windows.find(({ start }) => isValidSunTime(start) && start > now) ?? null
  )
}

export function getNextLightWindow(
  schedule: LightSchedule,
  now = new Date(),
  lat: number,
  lng: number,
): LightWindow | null {
  const nextToday = getNextWindow(schedule.windows, now)
  if (nextToday) return nextToday

  const tomorrow = new Date(schedule.date)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowSchedule = getLightSchedule(tomorrow, lat, lng)
  return (
    tomorrowSchedule.windows.find(({ start }) => isValidSunTime(start)) ?? null
  )
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function getNextWindowCountdownLabel(window: LightWindow): string {
  const name = window.category === 'goldenHour' ? 'golden hour' : 'blue hour'
  return `Next ${name} in`
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

export type SunArcMarker = {
  id: string
  label: string
  progress: number
  kind: 'sunrise' | 'sunset' | 'solarNoon' | 'goldenHour'
}

export type SunArcSegment = {
  id: string
  startProgress: number
  endProgress: number
  kind: 'track' | 'goldenHour'
}

function timeToDaylightProgress(schedule: LightSchedule, time: Date): number {
  const span = schedule.sunset.getTime() - schedule.sunrise.getTime()
  if (span <= 0) return 0
  return (time.getTime() - schedule.sunrise.getTime()) / span
}

export function getDaylightProgress(schedule: LightSchedule, time: Date): number {
  if (!isValidSunTime(schedule.sunrise) || !isValidSunTime(schedule.sunset)) {
    return 0
  }

  const span = schedule.sunset.getTime() - schedule.sunrise.getTime()
  if (span <= 0) return 0

  const elapsed = time.getTime() - schedule.sunrise.getTime()
  return Math.min(1, Math.max(0, elapsed / span))
}

export function isSunAboveHorizon(schedule: LightSchedule, time: Date): boolean {
  if (!isValidSunTime(schedule.sunrise) || !isValidSunTime(schedule.sunset)) {
    return false
  }

  return time >= schedule.sunrise && time <= schedule.sunset
}

export function daylightProgressToRadians(progress: number): number {
  return Math.PI * (1 - progress)
}

export function daylightProgressToPoint(
  progress: number,
  cx: number,
  cy: number,
  radius: number,
): { x: number; y: number } {
  const angle = daylightProgressToRadians(progress)
  return {
    x: cx + radius * Math.cos(angle),
    y: cy - radius * Math.sin(angle),
  }
}

export function describeDaylightArc(
  cx: number,
  cy: number,
  radius: number,
  startProgress: number,
  endProgress: number,
): string {
  const start = daylightProgressToPoint(startProgress, cx, cy, radius)
  const end = daylightProgressToPoint(endProgress, cx, cy, radius)
  const delta = endProgress - startProgress
  const largeArc = Math.abs(delta) > 0.5 ? 1 : 0

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

export function getSunArcMarkers(schedule: LightSchedule): SunArcMarker[] {
  if (!isValidSunTime(schedule.sunrise) || !isValidSunTime(schedule.sunset)) {
    return []
  }

  const { goldenHour, solarNoon } = schedule

  return [
    { id: 'sunrise', label: 'Sunrise', progress: 0, kind: 'sunrise' },
    {
      id: 'golden-morning',
      label: 'Golden',
      progress: timeToDaylightProgress(schedule, goldenHour.morning.end),
      kind: 'goldenHour',
    },
    {
      id: 'solar-noon',
      label: 'Noon',
      progress: timeToDaylightProgress(schedule, solarNoon),
      kind: 'solarNoon',
    },
    {
      id: 'golden-evening',
      label: 'Golden',
      progress: timeToDaylightProgress(schedule, goldenHour.evening.start),
      kind: 'goldenHour',
    },
    { id: 'sunset', label: 'Sunset', progress: 1, kind: 'sunset' },
  ]
}

export function getSunArcSegments(schedule: LightSchedule): SunArcSegment[] {
  if (!isValidSunTime(schedule.sunrise) || !isValidSunTime(schedule.sunset)) {
    return []
  }

  const morningEnd = timeToDaylightProgress(schedule, schedule.goldenHour.morning.end)
  const eveningStart = timeToDaylightProgress(schedule, schedule.goldenHour.evening.start)

  return [
    { id: 'track', startProgress: 0, endProgress: 1, kind: 'track' },
    {
      id: 'golden-morning',
      startProgress: 0,
      endProgress: morningEnd,
      kind: 'goldenHour',
    },
    {
      id: 'golden-evening',
      startProgress: eveningStart,
      endProgress: 1,
      kind: 'goldenHour',
    },
  ]
}
