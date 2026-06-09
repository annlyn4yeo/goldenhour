import type { WeatherCondition, WeatherData } from '../hooks/useWeather'

type ShootScoreResult = {
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

const LENS_RECOMMENDATIONS: Record<WeatherCondition, string> = {
  clear: 'Standard or short telephoto — clean edges and warm rim light on subjects.',
  partlyCloudy: 'Wide angle to frame dramatic cloud breaks against golden light.',
  cloudy: 'Mid-range zoom — isolate subjects against a soft, even sky.',
  overcast: 'Portrait lens — diffused light is forgiving on skin and detail.',
  foggy: 'Telephoto in haze — layers compress beautifully in muted tones.',
  rainy: 'Weather-sealed wide angle — capture reflections and wet surfaces up close.',
}

const GOLDEN_HOUR_BONUS: Partial<Record<WeatherCondition, number>> = {
  clear: 3,
  partlyCloudy: 2,
}

type VerdictRule = {
  matches: (weather: WeatherData, isGoldenHour: boolean, score: number) => boolean
  message: string
}

const VERDICT_RULES: VerdictRule[] = [
  {
    matches: (weather) => weather.condition === 'rainy',
    message: 'Rain will soften contrast — protect your gear and look for reflections instead.',
  },
  {
    matches: (weather, isGoldenHour) => isGoldenHour && weather.condition === 'clear',
    message: 'Golden hour with open sky — ideal for warm, directional light.',
  },
  {
    matches: (weather, isGoldenHour) => isGoldenHour && weather.condition === 'partlyCloudy',
    message: 'Broken cloud during golden hour — dramatic light with soft shadow pockets.',
  },
  {
    matches: (weather) => weather.condition === 'foggy' && weather.visibility > 500,
    message: 'Light fog adds atmosphere without killing visibility — shoot into the glow.',
  },
  {
    matches: (weather) => weather.condition === 'foggy' && weather.visibility <= 500,
    message: 'Dense fog limits depth — stay close and embrace the muted palette.',
  },
  {
    matches: (weather) => weather.condition === 'overcast',
    message: 'Heavy cloud flattens the light — lean into soft, even exposures.',
  },
  {
    matches: (_weather, _isGoldenHour, score) => score >= 8,
    message: 'Conditions are strong — get out there while the light holds.',
  },
  {
    matches: (_weather, _isGoldenHour, score) => score >= 5,
    message: 'Workable light — adjust your approach to match the skies.',
  },
]

export function getConditionLabel(condition: WeatherCondition): string {
  return CONDITION_LABELS[condition]
}

function applyGoldenHourBonus(score: number, weather: WeatherData, isGoldenHour: boolean): number {
  if (!isGoldenHour) return score
  return score + (GOLDEN_HOUR_BONUS[weather.condition] ?? 0)
}

function applyConditionAdjustments(score: number, weather: WeatherData): number {
  let next = score

  if (weather.condition === 'overcast') next -= 1

  if (weather.condition === 'foggy') {
    next += weather.visibility > 500 ? 1 : -2
  }

  if (weather.windSpeed < 10) next += 0.5
  if (weather.cloudCover >= 20 && weather.cloudCover <= 60) next += 1

  return next
}

function clampScore(score: number): number {
  return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10
}

function buildVerdict(weather: WeatherData, isGoldenHour: boolean, score: number): string {
  return (
    VERDICT_RULES.find(({ matches }) => matches(weather, isGoldenHour, score))?.message ??
    'Challenging conditions — consider waiting for clearer skies.'
  )
}

export function computeShootScore(
  weather: WeatherData,
  isGoldenHour: boolean,
): ShootScoreResult {
  const rawScore = applyConditionAdjustments(
    applyGoldenHourBonus(5, weather, isGoldenHour),
    weather,
  )
  const score = clampScore(rawScore)

  return {
    score,
    verdict: buildVerdict(weather, isGoldenHour, score),
  }
}

export function getLensRecommendation(condition: WeatherCondition): string {
  return LENS_RECOMMENDATIONS[condition]
}
