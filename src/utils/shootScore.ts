import type { WeatherCondition, WeatherData } from '../hooks/useWeather'

export type ShootScoreResult = {
  score: number
  verdict: string
}

const CONDITION_LABELS: Record<WeatherCondition, string> = {
  clear: 'Clear skies',
  partlyCloudy: 'Partly cloudy',
  cloudy: 'Cloudy',
  overcast: 'Overcast',
  foggy: 'Foggy',
  rainy: 'Rainy',
}

export function getConditionLabel(condition: WeatherCondition): string {
  return CONDITION_LABELS[condition]
}

export function computeShootScore(
  weather: WeatherData,
  isGoldenHour: boolean,
): ShootScoreResult {
  let score = 5

  if (isGoldenHour) {
    if (weather.condition === 'clear') {
      score += 3
    } else if (weather.condition === 'partlyCloudy') {
      score += 2
    }
  }

  if (weather.condition === 'overcast') {
    score -= 1
  }

  if (weather.condition === 'foggy') {
    if (weather.visibility > 500) {
      score += 1
    } else {
      score -= 2
    }
  }

  if (weather.windSpeed < 10) {
    score += 0.5
  }

  if (weather.cloudCover >= 20 && weather.cloudCover <= 60) {
    score += 1
  }

  score = Math.min(10, Math.max(0, score))
  const rounded = Math.round(score * 10) / 10

  return {
    score: rounded,
    verdict: buildVerdict(weather, isGoldenHour, rounded),
  }
}

function buildVerdict(
  weather: WeatherData,
  isGoldenHour: boolean,
  score: number,
): string {
  if (weather.condition === 'rainy') {
    return 'Rain will soften contrast — protect your gear and look for reflections instead.'
  }

  if (isGoldenHour && weather.condition === 'clear') {
    return 'Golden hour with open sky — ideal for warm, directional light.'
  }

  if (isGoldenHour && weather.condition === 'partlyCloudy') {
    return 'Broken cloud during golden hour — dramatic light with soft shadow pockets.'
  }

  if (weather.condition === 'foggy' && weather.visibility > 500) {
    return 'Light fog adds atmosphere without killing visibility — shoot into the glow.'
  }

  if (weather.condition === 'foggy' && weather.visibility <= 500) {
    return 'Dense fog limits depth — stay close and embrace the muted palette.'
  }

  if (weather.condition === 'overcast') {
    return 'Heavy cloud flattens the light — lean into soft, even exposures.'
  }

  if (score >= 8) {
    return 'Conditions are strong — get out there while the light holds.'
  }

  if (score >= 5) {
    return 'Workable light — adjust your approach to match the skies.'
  }

  return 'Challenging conditions — consider waiting for clearer skies.'
}

export const LENS_RECOMMENDATIONS: Record<WeatherCondition, string> = {
  clear: 'Standard or short telephoto — clean edges and warm rim light on subjects.',
  partlyCloudy: 'Wide angle to frame dramatic cloud breaks against golden light.',
  cloudy: 'Mid-range zoom — isolate subjects against a soft, even sky.',
  overcast: 'Portrait lens — diffused light is forgiving on skin and detail.',
  foggy: 'Telephoto in haze — layers compress beautifully in muted tones.',
  rainy: 'Weather-sealed wide angle — capture reflections and wet surfaces up close.',
}

export function getLensRecommendation(condition: WeatherCondition): string {
  return LENS_RECOMMENDATIONS[condition]
}
