import {
  getActiveWindow,
  getTimeOfDayPhase,
  isValidSunTime,
  type LightSchedule,
} from './goldenHour'
import {
  getWeatherCategoryLabel,
  isOvercastWeather,
  type WeatherCategory,
} from './weather'

export type ShootQualityRating = 'excellent' | 'good' | 'fair' | 'poor'

export type ShootQuality = {
  rating: ShootQualityRating
  label: string
  reason: string
}

const RATING_LABELS: Record<ShootQualityRating, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

export function getShootQualityLabel(rating: ShootQualityRating): string {
  return RATING_LABELS[rating]
}

function lightPhaseLabel(schedule: LightSchedule, now: Date): string {
  const phase = getTimeOfDayPhase(schedule, now)
  switch (phase) {
    case 'goldenHour':
      return 'golden hour'
    case 'blueHour':
      return 'blue hour'
    case 'dawn':
      return 'pre-dawn'
    case 'daytime':
      return 'daylight'
    case 'night':
      return 'night'
  }
}

function scoreFromLight(schedule: LightSchedule, now: Date): number {
  const activeWindow = getActiveWindow(schedule.windows, now)
  if (activeWindow?.category === 'goldenHour') return 4
  if (activeWindow?.category === 'blueHour') return 3

  const phase = getTimeOfDayPhase(schedule, now)
  if (phase === 'dawn') return 2
  if (phase === 'daytime') return 2
  if (
    isValidSunTime(schedule.sunrise) &&
    isValidSunTime(schedule.sunset) &&
    now >= schedule.sunrise &&
    now <= schedule.sunset
  ) {
    return 2
  }

  return 0
}

function scoreFromWeather(weather: WeatherCategory): number {
  switch (weather) {
    case 'clear':
      return 2
    case 'partlyCloudy':
      return 1
    case 'overcast':
      return 0
    case 'precipitation':
      return -2
  }
}

function ratingFromScore(score: number): ShootQualityRating {
  if (score >= 5) return 'excellent'
  if (score >= 3) return 'good'
  if (score >= 1) return 'fair'
  return 'poor'
}

export function getShootQuality(
  schedule: LightSchedule,
  now: Date,
  weather: WeatherCategory | null,
): ShootQuality {
  const lightScore = scoreFromLight(schedule, now)
  const weatherScore = weather ? scoreFromWeather(weather) : 0
  const score = lightScore + weatherScore
  const rating = ratingFromScore(score)
  const phase = lightPhaseLabel(schedule, now)

  if (weather === 'precipitation') {
    return {
      rating: 'poor',
      label: RATING_LABELS.poor,
      reason: `Rain or snow during ${phase} — wait for clearer skies if you can.`,
    }
  }

  const activeWindow = getActiveWindow(schedule.windows, now)

  if (activeWindow?.category === 'goldenHour') {
    if (weather === 'clear') {
      return {
        rating,
        label: RATING_LABELS[rating],
        reason: 'Golden hour with clear skies — warm, directional light.',
      }
    }
    if (weather === 'partlyCloudy') {
      return {
        rating,
        label: RATING_LABELS[rating],
        reason: 'Golden hour with broken cloud — moody light with soft shadows.',
      }
    }
    if (weather && isOvercastWeather(weather)) {
      return {
        rating,
        label: RATING_LABELS[rating],
        reason: 'Golden hour light is muted under heavy cloud cover.',
      }
    }
  }

  if (activeWindow?.category === 'blueHour') {
    if (weather === 'clear' || weather === 'partlyCloudy') {
      return {
        rating,
        label: RATING_LABELS[rating],
        reason: 'Blue hour with workable skies — cool tones and even exposure.',
      }
    }
    return {
      rating,
      label: RATING_LABELS[rating],
      reason: 'Blue hour, but clouds flatten the sky gradient.',
    }
  }

  if (weather) {
    return {
      rating,
      label: RATING_LABELS[rating],
      reason: `${phase.charAt(0).toUpperCase()}${phase.slice(1)} with ${getWeatherCategoryLabel(weather).toLowerCase()} skies.`,
    }
  }

  return {
    rating,
    label: RATING_LABELS[rating],
    reason: `${phase.charAt(0).toUpperCase()}${phase.slice(1)} — weather data unavailable, rating based on light only.`,
  }
}
