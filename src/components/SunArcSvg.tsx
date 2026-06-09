import type { RefObject } from 'react'
import type { SkyTextClasses } from '../hooks/useSkyTheme'
import { daylightProgressToPoint, describeDaylightArc } from '../lib/goldenHour'

const CX = 400
const CY = 210
const RADIUS = 180
const HORIZON_Y = 268
const VIEWBOX = '0 0 800 300'
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
  progress: number
  kind: 'primary' | 'golden'
}

type ArcSegment = {
  id: string
  start: number
  end: number
  color: string
}

type SunArcSvgProps = {
  uid: string
  trackPath: string
  arcPathRef: RefObject<SVGPathElement | null>
  arcLength: number | null
  segments: ArcSegment[]
  markers: ArcMarker[]
  sunDisplay: { x: number; y: number; belowHorizon: boolean }
  sunAboveHorizon: boolean
  phaseGlow: string
  ink: SkyTextClasses
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function labelYOffset(progress: number): number {
  if (progress < 0.12) return 20
  if (progress > 0.88) return 20
  return 22
}

export { CX, CY, RADIUS, HORIZON_Y, VIEWBOX, ARC_COLORS }

export default function SunArcSvg({
  uid,
  trackPath,
  arcPathRef,
  arcLength,
  segments,
  markers,
  sunDisplay,
  sunAboveHorizon,
  phaseGlow,
  ink,
}: SunArcSvgProps) {
  return (
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
        ref={arcPathRef}
        d={trackPath}
        fill="none"
        stroke={`url(#arc-spectrum-${uid})`}
        strokeWidth={SEGMENT_WIDTH}
        strokeLinecap="round"
        opacity={0.92}
        filter={`url(#arc-glow-${uid})`}
        className={arcLength != null ? 'animate-arc-draw' : undefined}
        style={
          arcLength != null
            ? { ['--arc-length' as string]: `${arcLength}px` }
            : undefined
        }
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

      <g className="animate-sun-dot-fade-in" style={{ filter: phaseGlow }}>
        <circle
          cx={sunDisplay.x}
          cy={sunDisplay.y}
          r={22}
          fill={`url(#sun-glow-${uid})`}
          opacity={sunDisplay.belowHorizon ? 0.15 : sunAboveHorizon ? 0.85 : 0.35}
          className="motion-safe:transition-all motion-safe:duration-1000 motion-safe:ease-in-out"
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
          className="motion-safe:transition-all motion-safe:duration-1000 motion-safe:ease-in-out"
        />
      </g>
    </svg>
  )
}
