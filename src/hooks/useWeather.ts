import { useMemo } from 'react'
import type { WeatherCategory } from '../lib/weather'
import useFetch from './useFetch'

export type WeatherCondition =
  | 'clear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'overcast'
  | 'foggy'
  | 'rainy'

export type WeatherData = {
  cloudCover: number
  visibility: number
  windSpeed: number
  weatherCode: number
  condition: WeatherCondition
  weeklyCloudCover: number[]
}

type Coords = {
  lat: number
  lng: number
}

type UseWeatherParams = {
  coords: Coords | null
}

type UseWeatherReturn = {
  weather: WeatherData | null
  loading: boolean
  error: string | null
}

type OpenMeteoResponse = {
  current?: {
    cloud_cover?: number
    visibility?: number
    wind_speed_10m?: number
    weather_code?: number
  }
  hourly?: {
    time?: string[]
    cloud_cover?: number[]
  }
}

const WEATHER_CONDITION_CATEGORY: Record<WeatherCondition, WeatherCategory> = {
  clear: 'clear',
  partlyCloudy: 'partlyCloudy',
  cloudy: 'partlyCloudy',
  overcast: 'overcast',
  foggy: 'overcast',
  rainy: 'precipitation',
}

const WMO_WEATHER_CODE: Record<number, WeatherCondition> = {
  0: 'clear',
  1: 'partlyCloudy',
  2: 'cloudy',
  3: 'overcast',
  45: 'foggy',
  48: 'foggy',
}

const WMO_WEATHER_CODE_RANGES: Array<[number, number, WeatherCondition]> = [
  [51, 67, 'rainy'],
  [71, 77, 'rainy'],
  [80, 99, 'rainy'],
]

function isValidCoords(coords: Coords | null): coords is Coords {
  if (!coords) return false
  const { lat, lng } = coords
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

export function weatherConditionToCategory(condition: WeatherCondition): WeatherCategory {
  return WEATHER_CONDITION_CATEGORY[condition]
}

function mapWmoWeatherCode(code: number): WeatherCondition {
  const exact = WMO_WEATHER_CODE[code]
  if (exact) return exact

  for (const [min, max, condition] of WMO_WEATHER_CODE_RANGES) {
    if (code >= min && code <= max) return condition
  }

  return 'partlyCloudy'
}

function computeWeeklyCloudCover(hourly: OpenMeteoResponse['hourly']): number[] {
  const times = hourly?.time ?? []
  const covers = hourly?.cloud_cover ?? []
  if (times.length === 0 || covers.length === 0) {
    return Array.from({ length: 7 }, () => 0)
  }

  const dailyBuckets = new Map<string, number[]>()

  for (let i = 0; i < times.length; i++) {
    const dateKey = times[i].slice(0, 10)
    const cover = covers[i]
    if (cover === undefined) continue
    const bucket = dailyBuckets.get(dateKey) ?? []
    bucket.push(cover)
    dailyBuckets.set(dateKey, bucket)
  }

  const sortedDays = [...dailyBuckets.keys()].sort().slice(0, 7)
  const averages = sortedDays.map((day) => {
    const values = dailyBuckets.get(day) ?? []
    if (values.length === 0) return 0
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
  })

  while (averages.length < 7) {
    averages.push(averages.at(-1) ?? 0)
  }

  return averages
}

function parseOpenMeteoResponse(data: OpenMeteoResponse): WeatherData {
  const current = data.current ?? {}
  const weatherCode = current.weather_code ?? 0

  return {
    cloudCover: current.cloud_cover ?? 0,
    visibility: current.visibility ?? 10_000,
    windSpeed: current.wind_speed_10m ?? 0,
    weatherCode,
    condition: mapWmoWeatherCode(weatherCode),
    weeklyCloudCover: computeWeeklyCloudCover(data.hourly),
  }
}

function buildWeatherUrl(lat: number, lng: number): string {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('current', 'cloud_cover,visibility,wind_speed_10m,weather_code')
  url.searchParams.set('hourly', 'cloud_cover')
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set('timezone', 'auto')
  return url.toString()
}

export default function useWeather({ coords }: UseWeatherParams): UseWeatherReturn {
  const coordsKey = coords ? `${coords.lat},${coords.lng}` : null
  const enabled = isValidCoords(coords)

  const weatherUrl = useMemo(
    () => (enabled ? buildWeatherUrl(coords.lat, coords.lng) : null),
    [coordsKey, enabled],
  )

  const { data: raw, loading, error } = useFetch<OpenMeteoResponse>(
    weatherUrl,
    [coordsKey],
    { enabled, errorMessage: 'Unable to load weather forecast.' },
  )

  const weather = useMemo(
    () => (raw ? parseOpenMeteoResponse(raw) : null),
    [raw],
  )

  return { weather, loading, error }
}
