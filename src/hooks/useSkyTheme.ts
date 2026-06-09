import { useMemo } from 'react'
import type { SkyPhase } from './useSunData'

export const SKY_BG_COLORS: Record<SkyPhase, string> = {
  night: '#0b0c1a',
  dawn: '#1a1035',
  blueHourMorning: '#1e2d6e',
  goldenHourMorning: '#c45c2e',
  solar: '#e8a020',
  goldenHourEvening: '#b84a20',
  blueHourEvening: '#1e2a6a',
  dusk: '#0f0d2a',
}

export type SkyTextTone = 'onWarm' | 'inverse'

export type SkyTextClasses = {
  text: string
  textMuted: string
  textHover: string
  fill: string
  fillMuted: string
  topBarHover: string
}

const SKY_TEXT_ON_WARM: SkyTextClasses = {
  text: 'text-ink-onWarm',
  textMuted: 'text-ink-onWarmMuted',
  textHover: 'hover:text-ink-onWarm',
  fill: 'fill-ink-onWarm',
  fillMuted: 'fill-ink-onWarmMuted',
  topBarHover: 'hover:bg-black/10',
}

const SKY_TEXT_INVERSE: SkyTextClasses = {
  text: 'text-ink-inverse',
  textMuted: 'text-ink-inverse opacity-80',
  textHover: 'hover:text-ink-inverse',
  fill: 'fill-ink-inverse',
  fillMuted: 'fill-ink-inverse opacity-80',
  topBarHover: 'hover:bg-white/10',
}

export function skyTextClassesForTone(tone: SkyTextTone): SkyTextClasses {
  return tone === 'onWarm' ? SKY_TEXT_ON_WARM : SKY_TEXT_INVERSE
}

function textToneForPhase(phase: SkyPhase): SkyTextTone {
  return phase === 'solar' ||
    phase === 'goldenHourMorning' ||
    phase === 'goldenHourEvening'
    ? 'onWarm'
    : 'inverse'
}

export type SkyTheme = {
  bgColor: string
  textTone: SkyTextTone
  textClasses: SkyTextClasses
  isLight: boolean
}

export default function useSkyTheme(currentSkyPhase: SkyPhase): SkyTheme {
  return useMemo(() => {
    const textTone = textToneForPhase(currentSkyPhase)
    return {
      bgColor: SKY_BG_COLORS[currentSkyPhase],
      textTone,
      textClasses: skyTextClassesForTone(textTone),
      isLight: textTone === 'onWarm',
    }
  }, [currentSkyPhase])
}
