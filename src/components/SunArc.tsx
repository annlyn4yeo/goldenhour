import { useEffect, useId, useMemo, useState } from 'react'
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
}

function inkTextClass(isLight: boolean, opacity?: string): string {
  const base = isLight ? 'text-ink-primary' : 'text-ink-inverse'
  return opacity ? `${base}/${opacity}` : base
}

function inkFillClass(isLight: boolean, opacity?: string): string {
  const base = isLight ? 'fill-ink-primary' : 'fill-ink-inverse'
  return opacity ? `${base}/${opacity}` : base
}

const CX = 400
const CY = 220
const RADIUS = 180
const HORIZON_Y = 240

const ARC_COLORS = {
  night: '#0b0c1a',
  blueHour: '#3d4fa8',
  goldenHour: '#e8843a',
  solar: '#f5c842',
} as const

type ArcMarker = {
  id: string
  label: string
  time: Date
  progress: number
}

function timeToArcProgress(sunrise: Date, sunset: Date, time: Date): number {
  const span = sunset.getTime() - sunrise.getTime()
  if (span <= 0) return 0
  return (time.getTime() - sunrise.getTime()) / span
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function altitudeToArcProgress(
  altitude: number,
  sunrise: Date,
  sunset: Date,
  solarNoon: Date,
  now: Date,
): number {
  if (!isValidSunTime(sunrise) || !isValidSunTime(sunset)) return 0

  const span = sunset.getTime() - sunrise.getTime()
  if (span <= 0) return 0

  const timeProgress = clampProgress((now.getTime() - sunrise.getTime()) / span)

  if (altitude <= 0) {
    if (now.getTime() < sunrise.getTime()) return 0
    if (now.getTime() > sunset.getTime()) return 1
    return timeProgress
  }

  const noonProgress = clampProgress(timeToArcProgress(sunrise, sunset, solarNoon))
  const altRatio = Math.min(1, Math.max(0, altitude / 45))

  if (timeProgress <= noonProgress) {
    return clampProgress((altRatio * noonProgress) / Math.max(noonProgress, 0.01))
  }

  const afternoonSpan = 1 - noonProgress
  const afternoonProgress = (timeProgress - noonProgress) / Math.max(afternoonSpan, 0.01)
  return clampProgress(noonProgress + altRatio * afternoonProgress * afternoonSpan)
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

function getPhaseGlow(skyPhase: SunData['currentSkyPhase']): string {
  switch (skyPhase) {
    case 'goldenHourMorning':
    case 'goldenHourEvening':
      return 'drop-shadow(0 0 24px rgba(232, 132, 58, 0.45))'
    case 'blueHourMorning':
    case 'blueHourEvening':
      return 'drop-shadow(0 0 24px rgba(45, 58, 140, 0.5))'
    case 'solar':
      return 'drop-shadow(0 0 28px rgba(245, 200, 66, 0.55))'
    case 'dawn':
    case 'dusk':
      return 'drop-shadow(0 0 20px rgba(196, 92, 46, 0.35))'
    case 'night':
      return 'drop-shadow(0 0 16px rgba(11, 12, 26, 0.6))'
  }
}

type ArcSegment = {
  id: string
  start: number
  end: number
  color: string
  width: number
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
    { id: 'blue-morning', start: 0, end: 0.04, color: ARC_COLORS.blueHour, width: 3 },
    {
      id: 'golden-morning',
      start: 0,
      end: pGoldenMorningEnd,
      color: ARC_COLORS.goldenHour,
      width: 4,
    },
    {
      id: 'solar',
      start: pGoldenMorningEnd,
      end: pGoldenEveningStart,
      color: ARC_COLORS.solar,
      width: 3.5,
    },
    {
      id: 'golden-evening',
      start: pGoldenEveningStart,
      end: 1,
      color: ARC_COLORS.goldenHour,
      width: 4,
    },
    { id: 'blue-evening', start: 0.96, end: 1, color: ARC_COLORS.blueHour, width: 3 },
  ]
}

export default function SunArc({ sunData, cityName, isLight = false }: SunArcProps) {
  const gradientId = useId().replace(/:/g, '')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const hasValidDaylight =
    isValidSunTime(sunData.sunrise) && isValidSunTime(sunData.sunset)

  const markers = useMemo((): ArcMarker[] => {
    if (!hasValidDaylight) return []

    const { sunrise, sunset } = sunData
    const p = (time: Date) => clampProgress(timeToArcProgress(sunrise, sunset, time))

    return [
      { id: 'sunrise', label: formatTime(sunData.sunrise), time: sunData.sunrise, progress: 0 },
      {
        id: 'golden-morning-end',
        label: formatTime(sunData.goldenHourMorningEnd),
        time: sunData.goldenHourMorningEnd,
        progress: p(sunData.goldenHourMorningEnd),
      },
      {
        id: 'solar-noon',
        label: formatTime(sunData.solarNoon),
        time: sunData.solarNoon,
        progress: p(sunData.solarNoon),
      },
      {
        id: 'golden-evening-start',
        label: formatTime(sunData.goldenHourEveningStart),
        time: sunData.goldenHourEveningStart,
        progress: p(sunData.goldenHourEveningStart),
      },
      { id: 'sunset', label: formatTime(sunData.sunset), time: sunData.sunset, progress: 1 },
    ]
  }, [hasValidDaylight, sunData])

  const segments = useMemo(() => buildArcSegments(sunData), [sunData])

  const sunProgress = useMemo(() => {
    if (!hasValidDaylight) return 0
    return altitudeToArcProgress(
      sunData.sunPosition.altitude,
      sunData.sunrise,
      sunData.sunset,
      sunData.solarNoon,
      now,
    )
  }, [hasValidDaylight, sunData, now])

  const sunPoint = daylightProgressToPoint(sunProgress, CX, CY, RADIUS)
  const sunAboveHorizon = sunData.sunPosition.altitude > 0

  const minutesAway = Math.max(
    0,
    Math.round((sunData.nextWindow.time.getTime() - now.getTime()) / 60_000),
  )

  const phaseGlow = getPhaseGlow(sunData.currentSkyPhase)

  if (!hasValidDaylight) {
    return (
      <div className="w-full max-w-4xl text-center">
        <p className={`font-display text-display italic ${inkTextClass(isLight, '80')}`}>
          Sun path unavailable
        </p>
        <p className={`mt-2 text-body ${inkTextClass(isLight, '60')}`}>
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
        viewBox="0 0 800 300"
        role="img"
        aria-label="Sun arc from sunrise to sunset with current position"
        className="w-full"
        style={{ filter: phaseGlow }}
      >
        <defs>
          <radialGradient id={`sun-glow-${gradientId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`arc-fade-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={ARC_COLORS.night} stopOpacity="0.7" />
            <stop offset="8%" stopColor={ARC_COLORS.blueHour} stopOpacity="0.9" />
            <stop offset="18%" stopColor={ARC_COLORS.goldenHour} />
            <stop offset="50%" stopColor={ARC_COLORS.solar} />
            <stop offset="82%" stopColor={ARC_COLORS.goldenHour} />
            <stop offset="92%" stopColor={ARC_COLORS.blueHour} stopOpacity="0.9" />
            <stop offset="100%" stopColor={ARC_COLORS.night} stopOpacity="0.7" />
          </linearGradient>
        </defs>

        <line
          x1={40}
          y1={HORIZON_Y}
          x2={760}
          y2={HORIZON_Y}
          stroke="rgba(250, 249, 246, 0.25)"
          strokeWidth={1}
        />

        <path
          d={trackPath}
          fill="none"
          stroke={`url(#arc-fade-${gradientId})`}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.35}
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
              strokeWidth={segment.width}
              strokeLinecap="round"
              opacity={0.85}
            />
          )
        })}

        {markers.map((marker) => {
          const { x, y } = daylightProgressToPoint(marker.progress, CX, CY, RADIUS)
          const isEndpoint = marker.progress === 0 || marker.progress === 1

          return (
            <g key={marker.id}>
              <line
                x1={x}
                y1={y}
                x2={x}
                y2={HORIZON_Y}
                stroke="rgba(250, 249, 246, 0.12)"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
              <circle
                cx={x}
                cy={y}
                r={isEndpoint ? 3 : 2.5}
                fill="rgba(250, 249, 246, 0.7)"
              />
              <text
                x={x}
                y={HORIZON_Y + 18}
                textAnchor="middle"
                className={inkFillClass(isLight, '70')}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: 11 }}
              >
                {marker.label}
              </text>
            </g>
          )
        })}

        <circle
          cx={sunPoint.x}
          cy={sunPoint.y}
          r={16}
          fill={`url(#sun-glow-${gradientId})`}
          opacity={sunAboveHorizon ? 0.6 : 0.2}
          className="transition-all duration-1000 ease-in-out"
        />
        <circle
          cx={sunPoint.x}
          cy={sunPoint.y}
          r={6}
          fill="#fde68a"
          stroke="rgba(250, 249, 246, 0.9)"
          strokeWidth={1.5}
          opacity={sunAboveHorizon ? 1 : 0.35}
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>

      <div className="mt-2 text-center">
        <h1
          className={`font-display text-[clamp(52px,8vw,64px)] leading-none italic ${inkTextClass(isLight)}`}
        >
          {sunData.nextWindow.label}
        </h1>
        <p
          className={`mt-3 text-bodyLg tabular-nums ${inkTextClass(isLight, '85')}`}
          aria-live="polite"
        >
          in {formatCountdownFromMinutes(minutesAway)}
        </p>
        {(cityName || sunData.date) && (
          <p className={`mt-4 text-caption ${inkTextClass(isLight, '55')}`}>
            {[cityName, formatTodayDate(sunData.date)].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </div>
  )
}
