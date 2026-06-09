export type WeatherCategory = 'clear' | 'partlyCloudy' | 'overcast' | 'precipitation'

export type WeatherSnapshot = {
  category: WeatherCategory
  label: string
  description: string
  cloudCover: number | null
  temperatureC: number | null
}

type OpenWeatherResponse = {
  weather?: Array<{ id: number; main: string; description: string }>
  clouds?: { all: number }
  main?: { temp: number }
}

const CATEGORY_LABELS: Record<WeatherCategory, string> = {
  clear: 'Clear',
  partlyCloudy: 'Partly cloudy',
  overcast: 'Overcast',
  precipitation: 'Rain or snow',
}

const CATEGORY_DESCRIPTIONS: Record<WeatherCategory, string> = {
  clear: 'Open sky — strong directional light.',
  partlyCloudy: 'Mixed sun and cloud — soft highlights with pockets of warmth.',
  overcast: 'Heavy cloud cover — flat, diffused light.',
  precipitation: 'Wet conditions — protect gear and expect low contrast.',
}

export function getWeatherCategoryLabel(category: WeatherCategory): string {
  return CATEGORY_LABELS[category]
}

export function getWeatherCategoryDescription(category: WeatherCategory): string {
  return CATEGORY_DESCRIPTIONS[category]
}

export function isOvercastWeather(category: WeatherCategory): boolean {
  return category === 'overcast' || category === 'precipitation'
}

export function mapOpenWeatherToCategory(
  weatherId: number,
  cloudCover: number | null,
): WeatherCategory {
  if (weatherId >= 200 && weatherId < 600) return 'precipitation'
  if (weatherId === 800) return 'clear'
  if (weatherId === 801) {
    if (cloudCover !== null && cloudCover >= 25) return 'partlyCloudy'
    return 'clear'
  }
  if (weatherId === 802) return 'partlyCloudy'
  if (weatherId === 803) return 'partlyCloudy'
  if (weatherId === 804) return 'overcast'

  if (cloudCover !== null) {
    if (cloudCover >= 75) return 'overcast'
    if (cloudCover >= 35) return 'partlyCloudy'
    return 'clear'
  }

  return 'partlyCloudy'
}

function parseOpenWeatherResponse(data: OpenWeatherResponse): WeatherSnapshot {
  const entry = data.weather?.[0]
  const cloudCover = data.clouds?.all ?? null
  const category = entry
    ? mapOpenWeatherToCategory(entry.id, cloudCover)
    : cloudCover !== null
      ? mapOpenWeatherToCategory(800, cloudCover)
      : 'partlyCloudy'

  return {
    category,
    label: CATEGORY_LABELS[category],
    description: entry?.description
      ? entry.description.charAt(0).toUpperCase() + entry.description.slice(1)
      : CATEGORY_DESCRIPTIONS[category],
    cloudCover,
    temperatureC: data.main?.temp ?? null,
  }
}

export async function fetchCurrentWeather(
  lat: number,
  lng: number,
): Promise<WeatherSnapshot> {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY

  if (!apiKey) {
    throw new Error('Weather API key is not configured.')
  }

  const url = new URL('https://api.openweathermap.org/data/2.5/weather')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('appid', apiKey)
  url.searchParams.set('units', 'metric')

  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Weather API key is invalid.')
    }
    throw new Error('Unable to load current weather.')
  }

  const data = (await response.json()) as OpenWeatherResponse
  return parseOpenWeatherResponse(data)
}
