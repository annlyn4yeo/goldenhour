import { useEffect, useId, useRef } from 'react'
import {
  daylightProgressToPoint,
  describeDaylightArc,
  formatTime,
  getDaylightProgress,
  getSunArcMarkers,
  getSunArcSegments,
  isSunAboveHorizon,
  isValidSunTime,
  type LightSchedule,
} from '../lib/goldenHour'

type SunArcRingProps = {
  schedule: LightSchedule
}

const CX = 100
const CY = 92
const RADIUS = 72
const TRACK_WIDTH = 3
const GOLDEN_WIDTH = 5

export default function SunArcRing({ schedule }: SunArcRingProps) {
  const sunRef = useRef<SVGCircleElement>(null)
  const glowRef = useRef<SVGCircleElement>(null)
  const gradientId = useId().replace(/:/g, '')

  const hasValidDaylight =
    isValidSunTime(schedule.sunrise) && isValidSunTime(schedule.sunset)

  useEffect(() => {
    if (!hasValidDaylight) return

    let frame = 0

    const updateSunPosition = () => {
      const now = new Date()
      const progress = getDaylightProgress(schedule, now)
      const aboveHorizon = isSunAboveHorizon(schedule, now)
      const { x, y } = daylightProgressToPoint(progress, CX, CY, RADIUS)

      if (sunRef.current) {
        sunRef.current.setAttribute('cx', String(x))
        sunRef.current.setAttribute('cy', String(y))
        sunRef.current.setAttribute('opacity', aboveHorizon ? '1' : '0.35')
      }

      if (glowRef.current) {
        glowRef.current.setAttribute('cx', String(x))
        glowRef.current.setAttribute('cy', String(y))
        glowRef.current.setAttribute('opacity', aboveHorizon ? '0.45' : '0.15')
      }

      frame = requestAnimationFrame(updateSunPosition)
    }

    frame = requestAnimationFrame(updateSunPosition)
    return () => cancelAnimationFrame(frame)
  }, [hasValidDaylight, schedule])

  if (!hasValidDaylight) {
    return (
      <p className="text-center text-sm text-stone-500">
        Sun path unavailable for this location today.
      </p>
    )
  }

  const markers = getSunArcMarkers(schedule)
  const segments = getSunArcSegments(schedule)
  const trackPath = describeDaylightArc(CX, CY, RADIUS, 0, 1)

  return (
    <div className="mx-auto w-full max-w-sm">
      <svg
        viewBox="0 0 200 130"
        role="img"
        aria-label="Sun path from sunrise to sunset with current position"
        className="w-full"
      >
        <defs>
          <radialGradient id={`sun-glow-${gradientId}`}>
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path
          d={trackPath}
          fill="none"
          stroke="#e7e5e4"
          strokeWidth={TRACK_WIDTH}
          strokeLinecap="round"
        />

        {segments
          .filter((segment) => segment.kind === 'goldenHour')
          .map((segment) => (
            <path
              key={segment.id}
              d={describeDaylightArc(
                CX,
                CY,
                RADIUS,
                segment.startProgress,
                segment.endProgress,
              )}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={GOLDEN_WIDTH}
              strokeLinecap="round"
              opacity={0.55}
            />
          ))}

        {markers.map((marker) => {
          const { x, y } = daylightProgressToPoint(marker.progress, CX, CY, RADIUS)
          const isEndpoint = marker.kind === 'sunrise' || marker.kind === 'sunset'
          const isNoon = marker.kind === 'solarNoon'

          return (
            <g key={marker.id}>
              <circle
                cx={x}
                cy={y}
                r={isNoon ? 3.5 : 2.5}
                fill={isEndpoint || isNoon ? '#78716c' : '#f59e0b'}
              />
              <text
                x={x}
                y={y + (isNoon ? -10 : 14)}
                textAnchor="middle"
                className="fill-stone-500 text-[8px] font-medium"
              >
                {marker.label}
              </text>
            </g>
          )
        })}

        <circle
          ref={glowRef}
          r={14}
          fill={`url(#sun-glow-${gradientId})`}
        />
        <circle
          ref={sunRef}
          r={5}
          fill="#f59e0b"
          stroke="#fffbeb"
          strokeWidth={1.5}
        />
      </svg>

      <div className="mt-1 flex justify-between text-xs text-stone-500">
        <span>{formatTime(schedule.sunrise)}</span>
        <span>{formatTime(schedule.solarNoon)}</span>
        <span>{formatTime(schedule.sunset)}</span>
      </div>
    </div>
  )
}
