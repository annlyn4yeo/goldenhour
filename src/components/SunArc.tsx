import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { skyTextClassesForTone, type SkyTextClasses } from '../hooks/useSkyTheme'
import useNow from '../hooks/useNow'
import type { SkyPhase, SunData } from '../hooks/useSunData'
import {
  daylightProgressToPoint,
  describeDaylightArc,
  formatTime,
  isValidSunTime,
} from '../lib/goldenHour'
import SunArcCountdown, { formatCountdownFromMinutes } from './SunArcCountdown'
import SunArcSvg, { ARC_COLORS, CX, CY, HORIZON_Y, RADIUS } from './SunArcSvg'

type SunArcProps = {
  sunData: SunData
  cityName?: string
  isLight?: boolean
  textClasses?: SkyTextClasses
  isLive?: boolean
}

const PHASE_GLOW: Record<SkyPhase, string> = {
  goldenHourMorning: 'drop-shadow(0 0 32px rgba(240, 144, 64, 0.55))',
  goldenHourEvening: 'drop-shadow(0 0 32px rgba(240, 144, 64, 0.55))',
  blueHourMorning: 'drop-shadow(0 0 28px rgba(91, 111, 212, 0.55))',
  blueHourEvening: 'drop-shadow(0 0 28px rgba(91, 111, 212, 0.55))',
  solar: 'drop-shadow(0 0 36px rgba(255, 213, 74, 0.65))',
  dawn: 'drop-shadow(0 0 24px rgba(196, 92, 46, 0.45))',
  dusk: 'drop-shadow(0 0 24px rgba(196, 92, 46, 0.45))',
  night: 'drop-shadow(0 0 20px rgba(91, 111, 212, 0.35))',
}

type ArcMarker = {
  id: string
  label: string
  time: Date
  progress: number
  kind: 'primary' | 'golden'
}

type ArcSegment = {
  id: string
  start: number
  end: number
  color: string
}

function resolveTextClasses(
  isLight: boolean,
  textClasses: SkyTextClasses | undefined,
  isLive: boolean,
): SkyTextClasses {
  if (!isLive) return skyTextClassesForTone('inverse')
  return textClasses ?? skyTextClassesForTone(isLight ? 'onWarm' : 'inverse')
}

function looksLikeCoordinates(name: string): boolean {
  return /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(name.trim())
}

function displayLocationName(cityName?: string): string | null {
  if (!cityName || looksLikeCoordinates(cityName)) return null
  return cityName
}

function timeToArcProgress(sunrise: Date, sunset: Date, time: Date): number {
  const span = sunset.getTime() - sunrise.getTime()
  if (span <= 0) return 0
  return (time.getTime() - sunrise.getTime()) / span
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function timeProgressAtNow(sunrise: Date, sunset: Date, now: Date): number {
  if (now.getTime() < sunrise.getTime()) return 0
  if (now.getTime() > sunset.getTime()) return 1
  return clampProgress(timeToArcProgress(sunrise, sunset, now))
}

function getSunDisplayPoint(
  sunrise: Date,
  sunset: Date,
  now: Date,
  cx: number,
  cy: number,
  radius: number,
  horizonY: number,
): { x: number; y: number; belowHorizon: boolean } {
  const nowMs = now.getTime()

  if (nowMs < sunrise.getTime()) {
    const left = daylightProgressToPoint(0, cx, cy, radius)
    return { x: left.x - 28, y: horizonY + 14, belowHorizon: true }
  }

  if (nowMs > sunset.getTime()) {
    const right = daylightProgressToPoint(1, cx, cy, radius)
    return { x: right.x + 28, y: horizonY + 14, belowHorizon: true }
  }

  const progress = timeProgressAtNow(sunrise, sunset, now)
  return { ...daylightProgressToPoint(progress, cx, cy, radius), belowHorizon: false }
}

function formatTodayDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function formatForecastGoldenHours(sunData: SunData): string {
  const morning = isValidSunTime(sunData.goldenHourMorningStart)
    ? formatTime(sunData.goldenHourMorningStart)
    : '—'
  const evening = isValidSunTime(sunData.goldenHourEveningStart)
    ? formatTime(sunData.goldenHourEveningStart)
    : '—'
  return `Morning ${morning} · Evening ${evening}`
}

function buildArcSegments(sunData: SunData): ArcSegment[] {
  if (!isValidSunTime(sunData.sunrise) || !isValidSunTime(sunData.sunset)) {
    return []
  }

  const { sunrise, sunset } = sunData
  const p = (time: Date) => clampProgress(timeToArcProgress(sunrise, sunset, time))

  const pGoldenMorningEnd = p(sunData.goldenHourMorningEnd)
  const pGoldenEveningStart = p(sunData.goldenHourEveningStart)

  return [
    { id: 'blue-morning', start: 0, end: 0.05, color: ARC_COLORS.blueHour },
    { id: 'golden-morning', start: 0, end: pGoldenMorningEnd, color: ARC_COLORS.goldenHour },
    { id: 'solar', start: pGoldenMorningEnd, end: pGoldenEveningStart, color: ARC_COLORS.solar },
    { id: 'golden-evening', start: pGoldenEveningStart, end: 1, color: ARC_COLORS.goldenHour },
    { id: 'blue-evening', start: 0.95, end: 1, color: ARC_COLORS.blueHour },
  ]
}

export default function SunArc({
  sunData,
  cityName,
  isLight = false,
  textClasses,
  isLive = true,
}: SunArcProps) {
  const ink = resolveTextClasses(isLight, textClasses, isLive)
  const uid = useId().replace(/:/g, '')
  const arcPathRef = useRef<SVGPathElement>(null)
  const [arcLength, setArcLength] = useState<number | null>(null)
  const now = useNow(1_000, isLive)

  const hasValidDaylight =
    isValidSunTime(sunData.sunrise) && isValidSunTime(sunData.sunset)

  const markers = useMemo((): ArcMarker[] => {
    if (!hasValidDaylight) return []

    const { sunrise, sunset } = sunData
    const p = (time: Date) => clampProgress(timeToArcProgress(sunrise, sunset, time))

    return [
      {
        id: 'sunrise',
        label: formatTime(sunData.sunrise),
        time: sunData.sunrise,
        progress: 0,
        kind: 'primary',
      },
      {
        id: 'golden-morning-end',
        label: '',
        time: sunData.goldenHourMorningEnd,
        progress: p(sunData.goldenHourMorningEnd),
        kind: 'golden',
      },
      {
        id: 'solar-noon',
        label: formatTime(sunData.solarNoon),
        time: sunData.solarNoon,
        progress: p(sunData.solarNoon),
        kind: 'primary',
      },
      {
        id: 'golden-evening-start',
        label: '',
        time: sunData.goldenHourEveningStart,
        progress: p(sunData.goldenHourEveningStart),
        kind: 'golden',
      },
      {
        id: 'sunset',
        label: formatTime(sunData.sunset),
        time: sunData.sunset,
        progress: 1,
        kind: 'primary',
      },
    ]
  }, [hasValidDaylight, sunData])

  const segments = useMemo(
    () => (isLive ? buildArcSegments(sunData) : []),
    [isLive, sunData],
  )

  const referenceTime = isLive ? now : sunData.solarNoon

  const sunDisplay = useMemo(() => {
    if (!hasValidDaylight) {
      return { x: CX, y: CY, belowHorizon: false }
    }
    return getSunDisplayPoint(
      sunData.sunrise,
      sunData.sunset,
      referenceTime,
      CX,
      CY,
      RADIUS,
      HORIZON_Y,
    )
  }, [hasValidDaylight, sunData.sunrise, sunData.sunset, referenceTime])

  const sunAboveHorizon = isLive
    ? sunData.sunPosition.altitude > 0
    : hasValidDaylight && isValidSunTime(sunData.solarNoon)

  const minutesAway = isLive
    ? Math.max(
        0,
        Math.round((sunData.nextWindow.time.getTime() - now.getTime()) / 60_000),
      )
    : 0

  const phaseGlow = PHASE_GLOW[sunData.currentSkyPhase]
  const locationLabel = displayLocationName(cityName)
  const trackPath = hasValidDaylight
    ? describeDaylightArc(CX, CY, RADIUS, 0, 1)
    : ''

  useLayoutEffect(() => {
    if (!hasValidDaylight || !arcPathRef.current) return
    setArcLength(arcPathRef.current.getTotalLength())
  }, [hasValidDaylight, trackPath])

  const countdownText = formatCountdownFromMinutes(minutesAway)

  if (!hasValidDaylight) {
    return (
      <div className="w-full max-w-4xl text-center">
        <p className={`font-display text-display ${ink.textMuted}`}>
          Sun path unavailable
        </p>
        <p className={`mt-2 text-body ${ink.textMuted}`}>
          Polar day or night at this location today.
        </p>
      </div>
    )
  }

  return (
    <div
      className="w-full max-w-4xl"
      data-sky-phase={sunData.currentSkyPhase}
    >
      <SunArcSvg
        uid={uid}
        trackPath={trackPath}
        arcPathRef={arcPathRef}
        arcLength={arcLength}
        segments={segments}
        markers={markers}
        sunDisplay={sunDisplay}
        sunAboveHorizon={sunAboveHorizon}
        phaseGlow={phaseGlow}
        ink={ink}
      />

      <div className="mt-1 text-center">
        <h1
          className={`font-display text-[36px] font-normal leading-[0.95] tracking-tight lg:text-[52px] ${ink.text}`}
        >
          {sunData.nextWindow.label}
        </h1>
        <p
          className={`mt-4 text-body font-medium tabular-nums tracking-wide lg:text-bodyLg ${ink.textMuted}`}
          aria-live={isLive ? 'polite' : undefined}
        >
          {isLive ? (
            <>
              in <SunArcCountdown text={countdownText} />
            </>
          ) : (
            formatForecastGoldenHours(sunData)
          )}
        </p>
        {(locationLabel || sunData.date) && (
          <p className={`mt-5 text-body font-medium tracking-wide ${ink.textMuted}`}>
            {[locationLabel, formatTodayDate(sunData.date)].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </div>
  )
}
