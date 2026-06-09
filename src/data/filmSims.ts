import type { SkyPhase } from '../hooks/useSunData'
import { isOvercastWeather, type WeatherCategory } from '../lib/weather'

export type FilmSimSettings = {
  whiteBalance: string
  highlight: string
  shadow: string
  color: string
  sharpness: string
  noiseReduction: string
}

export type FilmSim = {
  id: string
  name: string
  description: string
  bestFor: SkyPhase[]
  settings: FilmSimSettings
  mood: string
  colorProfile: [string, string, string]
}

export const filmSims: FilmSim[] = [
  {
    id: 'provia',
    name: 'Provia / Standard',
    description: 'Neutral fidelity for everyday light — true color without editorial bias.',
    bestFor: [
      'solar',
      'goldenHourMorning',
      'goldenHourEvening',
      'blueHourMorning',
      'blueHourEvening',
      'dawn',
      'dusk',
    ],
    settings: {
      whiteBalance: 'Auto',
      highlight: '-1',
      shadow: '0',
      color: '0',
      sharpness: '0',
      noiseReduction: '-2',
    },
    mood: 'true to life',
    colorProfile: ['#c8b89a', '#8a9e7a', '#5c6b7a'],
  },
  {
    id: 'velvia',
    name: 'Velvia',
    description: 'Saturated warmth that drinks in low sun — landscapes glow at the edges.',
    bestFor: ['goldenHourMorning', 'goldenHourEvening'],
    settings: {
      whiteBalance: 'Shade (+2)',
      highlight: '-2',
      shadow: '+1',
      color: '+2',
      sharpness: '+1',
      noiseReduction: '-2',
    },
    mood: 'vivid warmth',
    colorProfile: ['#e85c2a', '#c43a18', '#6b8c3a'],
  },
  {
    id: 'astia',
    name: 'Astia / Soft',
    description: 'Gentle rolloff and flattering skin — golden light without the bite.',
    bestFor: ['goldenHourMorning', 'goldenHourEvening', 'dawn', 'dusk'],
    settings: {
      whiteBalance: 'Shade (+1)',
      highlight: '-1',
      shadow: '+1',
      color: '+1',
      sharpness: '-1',
      noiseReduction: '-2',
    },
    mood: 'soft portrait',
    colorProfile: ['#d4a574', '#b8886a', '#9a7b6e'],
  },
  {
    id: 'classic-chrome',
    name: 'Classic Chrome',
    description: 'Cool, documentary restraint — blue hour and overcast skies feel editorial.',
    bestFor: ['blueHourMorning', 'blueHourEvening', 'dawn'],
    settings: {
      whiteBalance: 'Daylight (-1 Blue)',
      highlight: '-1',
      shadow: '+1',
      color: '-1',
      sharpness: '0',
      noiseReduction: '-2',
    },
    mood: 'cool editorial',
    colorProfile: ['#6b7a8a', '#4a5568', '#8a9aaa'],
  },
  {
    id: 'pro-neg-hi',
    name: 'Pro Neg. Hi',
    description: 'Punchy contrast for portraits in open light — skin stays luminous, not flat.',
    bestFor: ['solar', 'goldenHourMorning', 'goldenHourEvening'],
    settings: {
      whiteBalance: 'Daylight',
      highlight: '-1',
      shadow: '+1',
      color: '0',
      sharpness: '-1',
      noiseReduction: '-2',
    },
    mood: 'bright portrait',
    colorProfile: ['#e8d4c4', '#c4a898', '#a08070'],
  },
  {
    id: 'pro-neg-std',
    name: 'Pro Neg. Std',
    description: 'Soft, even tones for faces in diffused light — twilight portraits feel natural.',
    bestFor: ['blueHourMorning', 'blueHourEvening', 'dawn', 'dusk'],
    settings: {
      whiteBalance: 'Auto',
      highlight: '0',
      shadow: '+1',
      color: '0',
      sharpness: '-2',
      noiseReduction: '-2',
    },
    mood: 'natural skin',
    colorProfile: ['#d8ccc0', '#b8a898', '#988880'],
  },
  {
    id: 'eterna',
    name: 'Eterna Cinema',
    description: 'Flat, cinematic midtones — harsh midday light softens into a film frame.',
    bestFor: ['solar'],
    settings: {
      whiteBalance: 'Daylight',
      highlight: '-2',
      shadow: '+2',
      color: '-2',
      sharpness: '-2',
      noiseReduction: '-2',
    },
    mood: 'cinematic flat',
    colorProfile: ['#9a9088', '#7a7068', '#5a5248'],
  },
  {
    id: 'classic-neg',
    name: 'Classic Neg',
    description: 'Warm shadows and amber highlights — evening street light with memory baked in.',
    bestFor: ['dusk', 'blueHourEvening'],
    settings: {
      whiteBalance: 'Incandescent (+1)',
      highlight: '+1',
      shadow: '+2',
      color: '+1',
      sharpness: '0',
      noiseReduction: '-2',
    },
    mood: 'amber nostalgia',
    colorProfile: ['#c87848', '#8a5030', '#3a2820'],
  },
  {
    id: 'acros',
    name: 'Acros',
    description: 'Silky monochrome with deep blacks — night and last light become graphite and silver.',
    bestFor: ['night', 'dusk'],
    settings: {
      whiteBalance: 'Auto',
      highlight: '+1',
      shadow: '+2',
      color: '0',
      sharpness: '+1',
      noiseReduction: '-1',
    },
    mood: 'silky mono',
    colorProfile: ['#e8e4dc', '#888480', '#282420'],
  },
  {
    id: 'nostalgic-neg',
    name: 'Nostalgic Neg',
    description: 'Faded warmth and lifted shadows — overcast days feel like found photographs.',
    bestFor: ['dawn', 'blueHourMorning', 'blueHourEvening', 'dusk'],
    settings: {
      whiteBalance: 'Auto',
      highlight: '-1',
      shadow: '+2',
      color: '+1',
      sharpness: '-1',
      noiseReduction: '-2',
    },
    mood: 'faded warmth',
    colorProfile: ['#d4b898', '#a88868', '#786050'],
  },
]

export const SKY_PHASE_LABELS: Record<SkyPhase, string> = {
  night: 'night',
  dawn: 'dawn',
  blueHourMorning: 'blue hour morning',
  goldenHourMorning: 'golden hour morning',
  solar: 'midday sun',
  goldenHourEvening: 'golden hour evening',
  blueHourEvening: 'blue hour evening',
  dusk: 'dusk',
}

function scoreFilmSim(
  sim: FilmSim,
  skyPhase: SkyPhase,
  weather?: WeatherCategory | null,
): number {
  let score = sim.bestFor.includes(skyPhase) ? 10 : 0

  if (sim.id === 'nostalgic-neg' && weather && isOvercastWeather(weather)) {
    score += 15
  } else if (sim.id === 'nostalgic-neg' && weather === 'partlyCloudy') {
    score += 8
  }

  if (sim.id === 'provia' && score === 0) {
    score = 1
  }

  return score
}

export function getRankedFilmSims(
  skyPhase: SkyPhase,
  weather?: WeatherCategory | null,
): FilmSim[] {
  return [...filmSims].sort(
    (a, b) => scoreFilmSim(b, skyPhase, weather) - scoreFilmSim(a, skyPhase, weather),
  )
}

export function getBestFilmSim(
  skyPhase: SkyPhase,
  weather?: WeatherCategory | null,
): FilmSim {
  return getRankedFilmSims(skyPhase, weather)[0]
}

export function getAlternateFilmSims(
  skyPhase: SkyPhase,
  excludeId: string,
  weather?: WeatherCategory | null,
): FilmSim[] {
  return getRankedFilmSims(skyPhase, weather)
    .filter((sim) => sim.id !== excludeId)
    .slice(0, 3)
}
