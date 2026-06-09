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

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

export function isValidSunTime(date: Date): boolean {
  return !Number.isNaN(date.getTime())
}

function daylightProgressToRadians(progress: number): number {
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
