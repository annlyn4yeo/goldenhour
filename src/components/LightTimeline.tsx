import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import useNow from '../hooks/useNow'
import type { SunDayData } from '../hooks/useSunData'
import { formatDuration, formatTime, isValidSunTime } from '../lib/goldenHour'
import { SECTION_TITLE_CLASS } from './uiClasses'

type LightTimelineProps = {
  sunData: SunDayData
  isLive?: boolean
}

type EventKind = 'golden' | 'blue' | 'dark' | 'solar'

type TimelineEvent = {
  id: string
  label: string
  time: Date
  kind: EventKind
}

const DOT_COLORS: Record<EventKind, string> = {
  golden: '#e8843a',
  blue: '#1e2d6e',
  dark: '#1a1814',
  solar: '#e8a020',
}

function buildTimelineEvents(sunData: SunDayData): TimelineEvent[] {
  return [
    { id: 'astronomical-dawn', label: 'Astronomical dawn', time: sunData.astronomicalDawn, kind: 'dark' },
    { id: 'nautical-dawn', label: 'Nautical dawn', time: sunData.nauticalDawn, kind: 'dark' },
    {
      id: 'civil-dawn',
      label: 'Civil dawn / Blue hour start',
      time: sunData.civilDawn,
      kind: 'blue',
    },
    {
      id: 'sunrise',
      label: 'Sunrise / Golden hour start',
      time: sunData.sunrise,
      kind: 'golden',
    },
    {
      id: 'golden-morning-end',
      label: 'Golden hour end',
      time: sunData.goldenHourMorningEnd,
      kind: 'golden',
    },
    { id: 'solar-noon', label: 'Solar noon', time: sunData.solarNoon, kind: 'solar' },
    {
      id: 'golden-evening-start',
      label: 'Golden hour start',
      time: sunData.goldenHourEveningStart,
      kind: 'golden',
    },
    {
      id: 'sunset',
      label: 'Sunset / Golden hour end',
      time: sunData.sunset,
      kind: 'golden',
    },
    {
      id: 'civil-dusk',
      label: 'Civil dusk / Blue hour end',
      time: sunData.civilDusk,
      kind: 'blue',
    },
    { id: 'nautical-dusk', label: 'Nautical dusk', time: sunData.nauticalDusk, kind: 'dark' },
    {
      id: 'astronomical-dusk',
      label: 'Astronomical dusk',
      time: sunData.astronomicalDusk,
      kind: 'dark',
    },
  ]
}

function getActiveEventIndex(events: TimelineEvent[], now: Date): number {
  let active = -1

  for (let index = 0; index < events.length; index++) {
    const { time } = events[index]
    if (!isValidSunTime(time)) continue
    if (time.getTime() <= now.getTime()) {
      active = index
    } else {
      break
    }
  }

  return active
}

function formatRelativeLabel(time: Date, now: Date): string {
  const deltaMs = time.getTime() - now.getTime()
  const minutes = Math.round(Math.abs(deltaMs) / 60_000)

  if (minutes === 0) return 'now'

  const duration = formatDuration(minutes * 60_000)
  return deltaMs > 0 ? `in ${duration}` : `${duration} ago`
}

type TimelineRowProps = {
  event: TimelineEvent
  isLive: boolean
  now: Date
  isLast: boolean
  rowRef: (element: HTMLDivElement | null) => void
}

function TimelineRow({ event, isLive, now, isLast, rowRef }: TimelineRowProps) {
  const hasValidTime = isValidSunTime(event.time)
  const durationLabel =
    isLive && hasValidTime ? formatRelativeLabel(event.time, now) : isLive ? '—' : '—'

  return (
    <div ref={rowRef} className="relative z-10 -mx-3 rounded-lg px-3 py-2.5">
      <div className="relative flex items-baseline gap-3 pl-5">
        <span
          className="absolute top-[0.45rem] left-0 z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-2 ring-surface-card"
          style={{ backgroundColor: DOT_COLORS[event.kind] }}
          aria-hidden="true"
        />
        {!isLast && (
          <span
            className="absolute top-[0.85rem] bottom-[-0.65rem] left-0 w-px -translate-x-1/2 bg-surface-border"
            aria-hidden="true"
          />
        )}

        <span className="min-w-0 flex-1 text-body text-ink-primary">{event.label}</span>
        <span className="shrink-0 font-display text-body text-ink-primary tabular-nums">
          {hasValidTime ? formatTime(event.time) : '—'}
        </span>
      </div>

      {(isLive || durationLabel !== '—') && (
        <p className="mt-0.5 pl-5 text-caption text-ink-tertiary">{durationLabel}</p>
      )}
    </div>
  )
}

export default function LightTimeline({ sunData, isLive = false }: LightTimelineProps) {
  const now = useNow(60_000, isLive)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const [highlight, setHighlight] = useState<{ top: number; height: number } | null>(null)

  const events = useMemo(() => buildTimelineEvents(sunData), [sunData])
  const activeIndex = useMemo(
    () => (isLive ? getActiveEventIndex(events, now) : -1),
    [events, isLive, now],
  )

  useLayoutEffect(() => {
    if (activeIndex < 0) {
      setHighlight(null)
      return
    }

    const row = rowRefs.current[activeIndex]
    if (!row) {
      setHighlight(null)
      return
    }

    setHighlight({ top: row.offsetTop, height: row.offsetHeight })
  }, [activeIndex, events])

  const title = isLive ? "today's light" : 'light schedule'

  return (
    <aside className="w-full">
      <h2 className={SECTION_TITLE_CLASS}>{title}</h2>

      <div className="relative mt-5">
        {highlight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 left-0 -mx-3 rounded-lg bg-surface-muted motion-safe:transition-[top,height] motion-safe:duration-300 motion-safe:ease-out"
            style={{ top: highlight.top, height: highlight.height }}
          />
        )}
        {events.map((event, index) => (
          <TimelineRow
            key={event.id}
            event={event}
            isLive={isLive}
            now={now}
            isLast={index === events.length - 1}
            rowRef={(element) => {
              rowRefs.current[index] = element
            }}
          />
        ))}
      </div>
    </aside>
  )
}
