import { useMemo } from 'react'
import SunCalc from 'suncalc'
import { formatDuration, isValidSunTime } from '../lib/goldenHour'
import useNow from './useNow'

export type SkyPhase =
  | 'night'
  | 'dawn'
  | 'blueHourMorning'
  | 'goldenHourMorning'
  | 'solar'
  | 'goldenHourEvening'
  | 'blueHourEvening'
  | 'dusk'

export type SunDayData = {
  date: Date
  astronomicalDawn: Date
  nauticalDawn: Date
  civilDawn: Date
  sunrise: Date
  sunriseEnd: Date
  goldenHourMorningStart: Date
  goldenHourMorningEnd: Date
  solarNoon: Date
  goldenHourEveningStart: Date
  goldenHourEveningEnd: Date
  sunsetStart: Date
  sunset: Date
  civilDusk: Date
  nauticalDusk: Date
  astronomicalDusk: Date
  night: Date
  blueHourMorning: { start: Date; end: Date }
  blueHourEvening: { start: Date; end: Date }
  dayLength: string
  goldenHourTotalMinutes: number
}

export type SunData = SunDayData & {
  currentSkyPhase: SkyPhase
  nextWindow: { label: string; time: Date; minutesAway: number }
  sunPosition: { altitude: number; azimuth: number }
  forecast: SunDayData[]
}

type Coords = {
  lat: number
  lng: number
}

type UseSunDataParams = {
  coords: Coords
  targetDate?: Date
}

function startOfLocalDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(12, 0, 0, 0)
  return next
}

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function windowDurationMinutes(start: Date, end: Date): number {
  if (!isValidSunTime(start) || !isValidSunTime(end)) return 0
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000))
}

function readSunTimes(date: Date, lat: number, lng: number) {
  const times = SunCalc.getTimes(date, lat, lng)
  return {
    astronomicalDawn: times.nightEnd,
    nauticalDawn: times.nauticalDawn,
    civilDawn: times.dawn,
    sunrise: times.sunrise,
    sunriseEnd: times.sunriseEnd,
    goldenHourMorningStart: times.sunrise,
    goldenHourMorningEnd: times.goldenHourEnd,
    solarNoon: times.solarNoon,
    goldenHourEveningStart: times.goldenHour,
    goldenHourEveningEnd: times.sunset,
    sunsetStart: times.sunsetStart,
    sunset: times.sunset,
    civilDusk: times.dusk,
    nauticalDusk: times.nauticalDusk,
    astronomicalDusk: times.night,
    night: times.night,
  }
}

function computeDaylightMetrics(
  sunrise: Date,
  sunset: Date,
  goldenHourMorningStart: Date,
  goldenHourMorningEnd: Date,
  goldenHourEveningStart: Date,
  goldenHourEveningEnd: Date,
) {
  const dayLengthMs =
    isValidSunTime(sunrise) && isValidSunTime(sunset)
      ? sunset.getTime() - sunrise.getTime()
      : 0

  const goldenHourTotalMinutes =
    windowDurationMinutes(goldenHourMorningStart, goldenHourMorningEnd) +
    windowDurationMinutes(goldenHourEveningStart, goldenHourEveningEnd)

  return {
    dayLength: formatDuration(dayLengthMs),
    goldenHourTotalMinutes,
  }
}

function computeSunDayData(date: Date, lat: number, lng: number): SunDayData {
  const times = readSunTimes(date, lat, lng)
  const metrics = computeDaylightMetrics(
    times.sunrise,
    times.sunset,
    times.goldenHourMorningStart,
    times.goldenHourMorningEnd,
    times.goldenHourEveningStart,
    times.goldenHourEveningEnd,
  )

  return {
    date,
    ...times,
    blueHourMorning: { start: times.civilDawn, end: times.sunrise },
    blueHourEvening: { start: times.sunset, end: times.nauticalDusk },
    ...metrics,
  }
}

type PhaseCheck = {
  phase: SkyPhase
  isActive: (day: SunDayData, nowMs: number) => boolean
}

const SKY_PHASE_CHECKS: PhaseCheck[] = [
  {
    phase: 'night',
    isActive: (day, nowMs) =>
      isValidSunTime(day.astronomicalDawn) &&
      isValidSunTime(day.astronomicalDusk) &&
      (nowMs < day.astronomicalDawn.getTime() || nowMs >= day.astronomicalDusk.getTime()),
  },
  {
    phase: 'dawn',
    isActive: (day, nowMs) =>
      isValidSunTime(day.civilDawn) && nowMs < day.civilDawn.getTime(),
  },
  {
    phase: 'blueHourMorning',
    isActive: (day, nowMs) =>
      isValidSunTime(day.sunrise) && nowMs < day.sunrise.getTime(),
  },
  {
    phase: 'goldenHourMorning',
    isActive: (day, nowMs) =>
      isValidSunTime(day.goldenHourMorningEnd) && nowMs < day.goldenHourMorningEnd.getTime(),
  },
  {
    phase: 'solar',
    isActive: (day, nowMs) =>
      isValidSunTime(day.goldenHourEveningStart) && nowMs < day.goldenHourEveningStart.getTime(),
  },
  {
    phase: 'goldenHourEvening',
    isActive: (day, nowMs) =>
      isValidSunTime(day.sunset) && nowMs < day.sunset.getTime(),
  },
  {
    phase: 'blueHourEvening',
    isActive: (day, nowMs) =>
      isValidSunTime(day.nauticalDusk) && nowMs < day.nauticalDusk.getTime(),
  },
]

function getCurrentSkyPhase(day: SunDayData, coords: Coords, now: Date): SkyPhase {
  if (!isValidSunTime(day.sunrise) || !isValidSunTime(day.sunset)) {
    const { altitude } = SunCalc.getPosition(now, coords.lat, coords.lng)
    return altitude * (180 / Math.PI) > 0 ? 'solar' : 'night'
  }

  const nowMs = now.getTime()
  const match = SKY_PHASE_CHECKS.find(({ isActive }) => isActive(day, nowMs))
  return match?.phase ?? 'dusk'
}

type UpcomingWindow = {
  label: string
  time: Date
}

function getUpcomingWindows(day: SunDayData): UpcomingWindow[] {
  return [
    { label: 'Astronomical dawn', time: day.astronomicalDawn },
    { label: 'Nautical dawn', time: day.nauticalDawn },
    { label: 'Civil dawn', time: day.civilDawn },
    { label: 'Sunrise', time: day.sunrise },
    { label: 'Morning golden hour ends', time: day.goldenHourMorningEnd },
    { label: 'Solar noon', time: day.solarNoon },
    { label: 'Evening golden hour begins', time: day.goldenHourEveningStart },
    { label: 'Sunset', time: day.sunset },
    { label: 'Civil dusk', time: day.civilDusk },
    { label: 'Nautical dusk', time: day.nauticalDusk },
    { label: 'Astronomical dusk', time: day.astronomicalDusk },
  ]
    .filter(({ time }) => isValidSunTime(time))
    .sort((a, b) => a.time.getTime() - b.time.getTime())
}

function minutesUntil(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000))
}

function getNextWindow(
  day: SunDayData,
  forecast: SunDayData[],
  now: Date,
): { label: string; time: Date; minutesAway: number } {
  const todayNext = getUpcomingWindows(day).find(({ time }) => time > now)
  if (todayNext) {
    return {
      label: todayNext.label,
      time: todayNext.time,
      minutesAway: minutesUntil(now, todayNext.time),
    }
  }

  for (const forecastDay of forecast.slice(1)) {
    const nextDayWindow = getUpcomingWindows(forecastDay)[0]
    if (nextDayWindow) {
      return {
        label: nextDayWindow.label,
        time: nextDayWindow.time,
        minutesAway: minutesUntil(now, nextDayWindow.time),
      }
    }
  }

  return {
    label: 'Sunrise',
    time: day.sunrise,
    minutesAway: 0,
  }
}

function getSunPosition(coords: Coords, now: Date) {
  const { altitude, azimuth } = SunCalc.getPosition(now, coords.lat, coords.lng)
  return {
    altitude: altitude * (180 / Math.PI),
    azimuth: azimuth * (180 / Math.PI),
  }
}

function formatWeekdayPossessiveLight(date: Date): string {
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date)
  return `${weekday}'s light`
}

export function getDisplaySunData(
  sunData: SunData,
  selectedDayIndex: number,
  coords: Coords,
): SunData {
  if (selectedDayIndex === 0) return sunData

  const day = sunData.forecast[selectedDayIndex] ?? sunData.forecast[0]
  const referenceTime = isValidSunTime(day.solarNoon) ? day.solarNoon : day.date

  return {
    ...day,
    currentSkyPhase: 'solar',
    nextWindow: {
      label: formatWeekdayPossessiveLight(day.date),
      time: day.solarNoon,
      minutesAway: 0,
    },
    sunPosition: getSunPosition(coords, referenceTime),
    forecast: sunData.forecast,
  }
}

export default function useSunData({
  coords,
  targetDate,
}: UseSunDataParams): SunData {
  const now = useNow(60_000)

  const effectiveDateKey = targetDate
    ? toDateKey(startOfLocalDay(targetDate))
    : toDateKey(now)

  const coordsKey = `${coords.lat},${coords.lng}`

  const { dayData, forecast } = useMemo(() => {
    const reference = targetDate
      ? startOfLocalDay(targetDate)
      : startOfLocalDay(new Date(`${effectiveDateKey}T12:00:00`))
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(reference)
      date.setDate(reference.getDate() + index)
      return computeSunDayData(date, coords.lat, coords.lng)
    })

    return {
      dayData: days[0],
      forecast: days,
    }
  }, [effectiveDateKey, coordsKey, targetDate])

  const sunPosition = useMemo(
    () => getSunPosition(coords, now),
    [coords.lat, coords.lng, now],
  )

  const currentSkyPhase = useMemo(
    () => getCurrentSkyPhase(dayData, coords, now),
    [dayData, coords.lat, coords.lng, now],
  )

  const nextWindow = useMemo(
    () => getNextWindow(dayData, forecast, now),
    [dayData, forecast, now],
  )

  return {
    ...dayData,
    currentSkyPhase,
    nextWindow,
    sunPosition,
    forecast,
  }
}
