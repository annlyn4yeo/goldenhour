import { useEffect, useMemo, useState } from 'react'
import SunCalc from 'suncalc'
import { formatDuration, isValidSunTime } from '../lib/goldenHour'

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

function computeSunDayData(date: Date, lat: number, lng: number): SunDayData {
  const times = SunCalc.getTimes(date, lat, lng)

  const astronomicalDawn = times.nightEnd
  const nauticalDawn = times.nauticalDawn
  const civilDawn = times.dawn
  const sunrise = times.sunrise
  const sunriseEnd = times.sunriseEnd
  const goldenHourMorningStart = times.sunrise
  const goldenHourMorningEnd = times.goldenHourEnd
  const solarNoon = times.solarNoon
  const goldenHourEveningStart = times.goldenHour
  const goldenHourEveningEnd = times.sunset
  const sunsetStart = times.sunsetStart
  const sunset = times.sunset
  const civilDusk = times.dusk
  const nauticalDusk = times.nauticalDusk
  const astronomicalDusk = times.night
  const night = times.night

  const blueHourMorning = { start: civilDawn, end: sunrise }
  const blueHourEvening = { start: sunset, end: nauticalDusk }

  const dayLengthMs =
    isValidSunTime(sunrise) && isValidSunTime(sunset)
      ? sunset.getTime() - sunrise.getTime()
      : 0

  const goldenHourTotalMinutes =
    windowDurationMinutes(goldenHourMorningStart, goldenHourMorningEnd) +
    windowDurationMinutes(goldenHourEveningStart, goldenHourEveningEnd)

  return {
    date,
    astronomicalDawn,
    nauticalDawn,
    civilDawn,
    sunrise,
    sunriseEnd,
    goldenHourMorningStart,
    goldenHourMorningEnd,
    solarNoon,
    goldenHourEveningStart,
    goldenHourEveningEnd,
    sunsetStart,
    sunset,
    civilDusk,
    nauticalDusk,
    astronomicalDusk,
    night,
    blueHourMorning,
    blueHourEvening,
    dayLength: formatDuration(dayLengthMs),
    goldenHourTotalMinutes,
  }
}

function getCurrentSkyPhase(day: SunDayData, coords: Coords, now: Date): SkyPhase {
  if (!isValidSunTime(day.sunrise) || !isValidSunTime(day.sunset)) {
    const { altitude } = SunCalc.getPosition(now, coords.lat, coords.lng)
    return altitude * (180 / Math.PI) > 0 ? 'solar' : 'night'
  }

  const nowMs = now.getTime()

  if (
    isValidSunTime(day.astronomicalDawn) &&
    isValidSunTime(day.astronomicalDusk) &&
    (nowMs < day.astronomicalDawn.getTime() || nowMs >= day.astronomicalDusk.getTime())
  ) {
    return 'night'
  }

  if (isValidSunTime(day.civilDawn) && nowMs < day.civilDawn.getTime()) {
    return 'dawn'
  }

  if (isValidSunTime(day.sunrise) && nowMs < day.sunrise.getTime()) {
    return 'blueHourMorning'
  }

  if (isValidSunTime(day.goldenHourMorningEnd) && nowMs < day.goldenHourMorningEnd.getTime()) {
    return 'goldenHourMorning'
  }

  if (isValidSunTime(day.goldenHourEveningStart) && nowMs < day.goldenHourEveningStart.getTime()) {
    return 'solar'
  }

  if (isValidSunTime(day.sunset) && nowMs < day.sunset.getTime()) {
    return 'goldenHourEvening'
  }

  if (isValidSunTime(day.nauticalDusk) && nowMs < day.nauticalDusk.getTime()) {
    return 'blueHourEvening'
  }

  return 'dusk'
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
      minutesAway: Math.max(0, Math.round((todayNext.time.getTime() - now.getTime()) / 60_000)),
    }
  }

  for (const forecastDay of forecast.slice(1)) {
    const nextDayWindow = getUpcomingWindows(forecastDay)[0]
    if (nextDayWindow) {
      return {
        label: nextDayWindow.label,
        time: nextDayWindow.time,
        minutesAway: Math.max(
          0,
          Math.round((nextDayWindow.time.getTime() - now.getTime()) / 60_000),
        ),
      }
    }
  }

  const fallback = day.sunrise
  return {
    label: 'Sunrise',
    time: fallback,
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
  const [now, setNow] = useState(() => new Date())

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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

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
