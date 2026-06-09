import { getTimes } from 'suncalc'

export type GoldenHourWindow = {
  label: string
  start: Date
  end: Date
}

export type GoldenHourSchedule = {
  date: Date
  windows: GoldenHourWindow[]
}

export function getGoldenHourSchedule(
  date: Date,
  lat: number,
  lng: number,
): GoldenHourSchedule {
  const times = getTimes(date, lat, lng)

  return {
    date,
    windows: [
      {
        label: 'Morning',
        start: times.sunrise,
        end: times.goldenHour,
      },
      {
        label: 'Evening',
        start: times.goldenHourEnd,
        end: times.sunset,
      },
    ],
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

export function getActiveWindow(
  windows: GoldenHourWindow[],
  now = new Date(),
): GoldenHourWindow | null {
  return windows.find(({ start, end }) => now >= start && now <= end) ?? null
}

export function getNextWindow(
  windows: GoldenHourWindow[],
  now = new Date(),
): GoldenHourWindow | null {
  return windows.find(({ start }) => start > now) ?? null
}
