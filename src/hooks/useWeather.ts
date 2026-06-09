import { useEffect, useState } from 'react'
import type { WeatherCategory } from '../lib/weather'

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
  switch (condition) {
    case 'clear':
      return 'clear'
    case 'partlyCloudy':
    case 'cloudy':
      return 'partlyCloudy'
    case 'overcast':
    case 'foggy':
      return 'overcast'
    case 'rainy':
      return 'precipitation'
  }
}

export function mapWmoWeatherCode(code: number): WeatherCondition {
  if (code === 0) return 'clear'
  if (code === 1) return 'partlyCloudy'
  if (code === 2) return 'cloudy'
  if (code === 3) return 'overcast'
  if (code === 45 || code === 48) return 'foggy'
  if (
    (code >= 51 && code <= 67) ||
    (code >= 71 && code <= 77) ||
    (code >= 80 && code <= 99)
  ) {
    return 'rainy'
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
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
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

async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('current', 'cloud_cover,visibility,wind_speed_10m,weather_code')
  url.searchParams.set('hourly', 'cloud_cover')
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set('timezone', 'auto')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Unable to load weather forecast.')
  }

  const data = (await response.json()) as OpenMeteoResponse
  return parseOpenMeteoResponse(data)
}

export default function useWeather({ coords }: UseWeatherParams): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const coordsKey = coords ? `${coords.lat},${coords.lng}` : null

  useEffect(() => {
    if (!isValidCoords(coords)) {
      setWeather(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    void (async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchWeather(coords.lat, coords.lng)
        if (!cancelled) {
          setWeather(data)
        }
      } catch (err) {
        if (!cancelled) {
          setWeather(null)
          setError(err instanceof Error ? err.message : 'Weather unavailable.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [coordsKey])

  return { weather, loading, error }
}
