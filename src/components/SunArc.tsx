import { useEffect, useId, useMemo, useState } from 'react'
import { skyTextClassesForTone, type SkyTextClasses } from '../hooks/useSkyTheme'
import type { SunData } from '../hooks/useSunData'
import {
  daylightProgressToPoint,
  describeDaylightArc,
  formatDuration,
  formatTime,
  isValidSunTime,
} from '../lib/goldenHour'

type SunArcProps = {
  sunData: SunData
  cityName?: string
  isLight?: boolean
  textClasses?: SkyTextClasses
  isLive?: boolean
}

function resolveTextClasses(
  isLight: boolean,
  textClasses?: SkyTextClasses,
): SkyTextClasses {
  return textClasses ?? skyTextClassesForTone(isLight ? 'onWarm' : 'inverse')
}

function looksLikeCoordinates(name: string): boolean {
  return /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(name.trim())
}

function displayLocationName(cityName?: string): string | null {
  if (!cityName || looksLikeCoordinates(cityName)) return null
  return cityName
}

const CX = 400
const CY = 228
const RADIUS = 180
const HORIZON_Y = 256
const VIEWBOX = '0 -48 800 360'
const TRACK_WIDTH = 4
const SEGMENT_WIDTH = 7

const ARC_COLORS = {
  track: 'rgba(250, 249, 246, 0.22)',
  night: '#1a1d3a',
  blueHour: '#5b6fd4',
  goldenHour: '#f09040',
  solar: '#ffd54a',
} as const

type ArcMarker = {
  id: string
  label: string
  time: Date
  progress: number
  kind: 'primary' | 'golden'
}

function timeToArcProgress(sunrise: Date, sunset: Date, time: Date): number {
  const span = sunset.getTime() - sunrise.getTime()
  if (span <= 0) return 0
  return (time.getTime() - sunrise.getTime()) / span
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function timeProgressAtNow(
  sunrise: Date,
  sunset: Date,
  now: Date,
): number {
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

function formatCountdownFromMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return 'now'
  return formatDuration(totalMinutes * 60_000)
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

function getPhaseGlow(skyPhase: SunData['currentSkyPhase']): string {
  switch (skyPhase) {
    case 'goldenHourMorning':
    case 'goldenHourEvening':
      return 'drop-shadow(0 0 32px rgba(240, 144, 64, 0.55))'
    case 'blueHourMorning':
    case 'blueHourEvening':
      return 'drop-shadow(0 0 28px rgba(91, 111, 212, 0.55))'
    case 'solar':
      return 'drop-shadow(0 0 36px rgba(255, 213, 74, 0.65))'
    case 'dawn':
    case 'dusk':
      return 'drop-shadow(0 0 24px rgba(196, 92, 46, 0.45))'
    case 'night':
      return 'drop-shadow(0 0 20px rgba(91, 111, 212, 0.35))'
  }
}

type ArcSegment = {
  id: string
  start: number
  end: number
  color: string
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

function labelYOffset(progress: number): number {
  if (progress < 0.12) return 20
  if (progress > 0.88) return 20
  return 22
}

export default function SunArc({
  sunData,
  cityName,
  isLight = false,
  textClasses,
  isLive = true,
}: SunArcProps) {
  const ink = resolveTextClasses(isLight, textClasses)
  const uid = useId().replace(/:/g, '')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!isLive) return
    const intervalId = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(intervalId)
  }, [isLive])

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

  const phaseGlow = getPhaseGlow(sunData.currentSkyPhase)
  const locationLabel = displayLocationName(cityName)

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

  const trackPath = describeDaylightArc(CX, CY, RADIUS, 0, 1)

  return (
    <div
      className="w-full max-w-4xl"
      data-sky-phase={sunData.currentSkyPhase}
    >
      <svg
        viewBox={VIEWBOX}
        overflow="visible"
        role="img"
        aria-label="Sun arc from sunrise to sunset with current position"
        className="w-full overflow-visible"
      >
        <defs>
          <radialGradient id={`sun-glow-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffe082" stopOpacity="1" />
            <stop offset="45%" stopColor="#ffd54a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffd54a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`arc-spectrum-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={ARC_COLORS.blueHour} />
            <stop offset="12%" stopColor={ARC_COLORS.goldenHour} />
            <stop offset="50%" stopColor={ARC_COLORS.solar} />
            <stop offset="88%" stopColor={ARC_COLORS.goldenHour} />
            <stop offset="100%" stopColor={ARC_COLORS.blueHour} />
          </linearGradient>
          <filter id={`sun-bloom-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`arc-glow-${uid}`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <line
          x1={32}
          y1={HORIZON_Y}
          x2={768}
          y2={HORIZON_Y}
          stroke="rgba(250, 249, 246, 0.35)"
          strokeWidth={1.5}
        />

        <path
          d={trackPath}
          fill="none"
          stroke={ARC_COLORS.track}
          strokeWidth={TRACK_WIDTH}
          strokeLinecap="round"
        />

        <path
          d={trackPath}
          fill="none"
          stroke={`url(#arc-spectrum-${uid})`}
          strokeWidth={SEGMENT_WIDTH}
          strokeLinecap="round"
          opacity={0.92}
          filter={`url(#arc-glow-${uid})`}
        />

        {segments.map((segment) => {
          const start = clampProgress(segment.start)
          const end = clampProgress(segment.end)
          if (end <= start) return null

          return (
            <path
              key={segment.id}
              d={describeDaylightArc(CX, CY, RADIUS, start, end)}
              fill="none"
              stroke={segment.color}
              strokeWidth={SEGMENT_WIDTH + 1}
              strokeLinecap="butt"
              opacity={0.55}
            />
          )
        })}

        {markers.map((marker) => {
          const { x, y } = daylightProgressToPoint(marker.progress, CX, CY, RADIUS)
          const isPrimary = marker.kind === 'primary'
          const isNoon = marker.id === 'solar-noon'

          return (
            <g key={marker.id}>
              {isPrimary && (
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={HORIZON_Y + 2}
                  stroke="rgba(250, 249, 246, 0.28)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={isPrimary ? 4 : 2.5}
                fill={isPrimary ? 'rgba(250, 249, 246, 0.9)' : ARC_COLORS.goldenHour}
                stroke={isPrimary ? 'rgba(250, 249, 246, 0.4)' : 'none'}
                strokeWidth={1}
              />
              {isPrimary && marker.label && (
                <text
                  x={x}
                  y={HORIZON_Y + labelYOffset(marker.progress)}
                  textAnchor="middle"
                  className={isNoon ? ink.fill : ink.fillMuted}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: isNoon ? 13 : 12,
                    fontWeight: isNoon ? 600 : 500,
                    letterSpacing: '0.02em',
                  }}
                >
                  {marker.label}
                </text>
              )}
            </g>
          )
        })}

        <g style={{ filter: phaseGlow }}>
          <circle
            cx={sunDisplay.x}
            cy={sunDisplay.y}
            r={22}
            fill={`url(#sun-glow-${uid})`}
            opacity={sunDisplay.belowHorizon ? 0.15 : sunAboveHorizon ? 0.85 : 0.35}
            className="transition-all duration-1000 ease-in-out"
          />
          <circle
            cx={sunDisplay.x}
            cy={sunDisplay.y}
            r={9}
            fill="#ffd54a"
            stroke="rgba(250, 249, 246, 0.95)"
            strokeWidth={2}
            opacity={sunDisplay.belowHorizon ? 0.2 : sunAboveHorizon ? 1 : 0.5}
            filter={`url(#sun-bloom-${uid})`}
            className="transition-all duration-1000 ease-in-out"
          />
        </g>
      </svg>

      <div className="mt-1 text-center">
        <h1
          className={`font-display text-[length:clamp(56px,9vw,72px)] font-normal leading-[0.95] tracking-tight ${ink.text}`}
        >
          {sunData.nextWindow.label}
        </h1>
        <p
          className={`mt-4 text-[length:clamp(18px,3vw,22px)] font-medium tabular-nums tracking-wide ${ink.textMuted}`}
          aria-live={isLive ? 'polite' : undefined}
        >
          {isLive
            ? `in ${formatCountdownFromMinutes(minutesAway)}`
            : formatForecastGoldenHours(sunData)}
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
