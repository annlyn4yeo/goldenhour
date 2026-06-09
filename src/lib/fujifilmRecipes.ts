import {
  getActiveWindow,
  isValidSunTime,
  type LightSchedule,
} from './goldenHour'

export type LightCondition =
  | 'goldenHour'
  | 'blueHour'
  | 'daylight'
  | 'overcast'
  | 'night'

export type FujifilmRecipe = {
  filmSimulation: string
  condition: LightCondition
  conditionLabel: string
  description: string
  whiteBalance: string
  highlights: string
  shadows: string
  dynamicRange: string
  color: string
}

const RECIPES: Record<LightCondition, FujifilmRecipe> = {
  goldenHour: {
    filmSimulation: 'Velvia',
    condition: 'goldenHour',
    conditionLabel: 'Golden hour',
    description: 'Warm, saturated light — push color and protect highlights.',
    whiteBalance: 'Shade (+2 Red)',
    highlights: '-2',
    shadows: '+2',
    dynamicRange: 'DR400',
    color: '+2',
  },
  blueHour: {
    filmSimulation: 'Acros',
    condition: 'blueHour',
    conditionLabel: 'Blue hour',
    description: 'Cool twilight tones — lean into contrast and deep blues.',
    whiteBalance: 'Daylight (-2 Blue)',
    highlights: '+1',
    shadows: '+2',
    dynamicRange: 'DR200',
    color: '-1',
  },
  overcast: {
    filmSimulation: 'Classic Chrome',
    condition: 'overcast',
    conditionLabel: 'Overcast',
    description: 'Flat, diffused light — muted tones and gentle contrast.',
    whiteBalance: 'Auto',
    highlights: '-1',
    shadows: '+1',
    dynamicRange: 'DR200',
    color: '-1',
  },
  daylight: {
    filmSimulation: 'Provia',
    condition: 'daylight',
    conditionLabel: 'Daylight',
    description: 'Neutral midday light — balanced color with controlled contrast.',
    whiteBalance: 'Daylight',
    highlights: '-2',
    shadows: '0',
    dynamicRange: 'DR400',
    color: '0',
  },
  night: {
    filmSimulation: 'Eterna',
    condition: 'night',
    conditionLabel: 'Low light',
    description: 'After sunset — soft contrast and restrained saturation.',
    whiteBalance: 'Incandescent (+1 Red)',
    highlights: '-1',
    shadows: '+1',
    dynamicRange: 'DR200',
    color: '-2',
  },
}

export function getLightCondition(
  schedule: LightSchedule,
  now: Date,
  overcast = false,
): LightCondition {
  const activeWindow = getActiveWindow(schedule.windows, now)

  if (activeWindow?.category === 'goldenHour') return 'goldenHour'
  if (activeWindow?.category === 'blueHour') return 'blueHour'

  if (!isValidSunTime(schedule.sunrise) || !isValidSunTime(schedule.sunset)) {
    return 'night'
  }

  if (now >= schedule.sunrise && now <= schedule.sunset) {
    return overcast ? 'overcast' : 'daylight'
  }

  return 'night'
}

export function getFujifilmRecipe(
  schedule: LightSchedule,
  now: Date,
  overcast = false,
): FujifilmRecipe {
  return RECIPES[getLightCondition(schedule, now, overcast)]
}
