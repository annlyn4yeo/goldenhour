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

export type SkyTextColor = 'primary' | 'inverse'

export type SkyTheme = {
  bgColor: string
  textColor: SkyTextColor
  isLight: boolean
}

function isLightSkyPhase(phase: SkyPhase): boolean {
  return (
    phase === 'solar' ||
    phase === 'goldenHourMorning' ||
    phase === 'goldenHourEvening'
  )
}

export default function useSkyTheme(currentSkyPhase: SkyPhase): SkyTheme {
  return useMemo(() => {
    const isLight = isLightSkyPhase(currentSkyPhase)
    return {
      bgColor: SKY_BG_COLORS[currentSkyPhase],
      textColor: isLight ? 'primary' : 'inverse',
      isLight,
    }
  }, [currentSkyPhase])
}
