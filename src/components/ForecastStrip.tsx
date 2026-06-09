import type { SunDayData } from '../hooks/useSunData'
import {
  describeDaylightArc,
  formatDuration,
  formatForecastDateLabel,
  formatForecastDayLabel,
  formatTime,
  isValidSunTime,
} from '../lib/goldenHour'

type ForecastStripProps = {
  forecast: SunDayData[]
  selectedDayIndex: number
  onSelectDay: (index: number) => void
}

const MINI_ARC_W = 50
const MINI_ARC_H = 20
const MINI_CX = MINI_ARC_W / 2
const MINI_CY = MINI_ARC_H - 2
const MINI_RADIUS = 22
const GOLDEN_HOUR_STROKE = '#e8843a'
const TRACK_STROKE = '#1a1814'

function daylightProgress(day: SunDayData, time: Date): number {
  if (!isValidSunTime(day.sunrise) || !isValidSunTime(day.sunset)) return 0

  const span = day.sunset.getTime() - day.sunrise.getTime()
  if (span <= 0) return 0

  return Math.min(1, Math.max(0, (time.getTime() - day.sunrise.getTime()) / span))
}

function MiniSunArc({ day }: { day: SunDayData }) {
  const hasDaylight =
    isValidSunTime(day.sunrise) && isValidSunTime(day.sunset)

  if (!hasDaylight) {
    return (
      <svg
        width={MINI_ARC_W}
        height={MINI_ARC_H}
        viewBox={`0 0 ${MINI_ARC_W} ${MINI_ARC_H}`}
        aria-hidden="true"
        className="mx-auto"
      >
        <line
          x1={4}
          y1={MINI_ARC_H - 2}
          x2={MINI_ARC_W - 4}
          y2={MINI_ARC_H - 2}
          stroke={TRACK_STROKE}
          strokeWidth={0.5}
          opacity={0.25}
        />
      </svg>
    )
  }

  const morningEnd = daylightProgress(day, day.goldenHourMorningEnd)
  const eveningStart = daylightProgress(day, day.goldenHourEveningStart)
  const trackPath = describeDaylightArc(MINI_CX, MINI_CY, MINI_RADIUS, 0, 1)

  return (
    <svg
      width={MINI_ARC_W}
      height={MINI_ARC_H}
      viewBox={`0 0 ${MINI_ARC_W} ${MINI_ARC_H}`}
      aria-hidden="true"
      className="mx-auto"
    >
      <path
        d={trackPath}
        fill="none"
        stroke={TRACK_STROKE}
        strokeWidth={0.5}
        strokeLinecap="round"
        opacity={0.25}
      />
      {morningEnd > 0 && (
        <path
          d={describeDaylightArc(MINI_CX, MINI_CY, MINI_RADIUS, 0, morningEnd)}
          fill="none"
          stroke={GOLDEN_HOUR_STROKE}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      )}
      {eveningStart < 1 && (
        <path
          d={describeDaylightArc(MINI_CX, MINI_CY, MINI_RADIUS, eveningStart, 1)}
          fill="none"
          stroke={GOLDEN_HOUR_STROKE}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

function formatTodayFullDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function DayCard({
  day,
  referenceDate,
  isSelected,
  onSelect,
  index,
}: {
  day: SunDayData
  referenceDate: Date
  isSelected: boolean
  onSelect: () => void
  index: number
}) {
  const hasMorning = isValidSunTime(day.goldenHourMorningStart)
  const hasEvening = isValidSunTime(day.goldenHourEveningStart)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`animate-forecast-card-enter w-[88px] shrink-0 snap-start rounded-xl px-3 py-3 text-center transition md:w-auto ${
        isSelected
          ? 'border-[0.5px] border-sky-goldenHour bg-surface-card'
          : 'border-[0.5px] border-transparent bg-surface-muted'
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <p className="text-caption text-ink-tertiary">
        {formatForecastDayLabel(day.date, referenceDate)}
      </p>
      <p className="mt-0.5 text-body text-ink-primary">
        {formatForecastDateLabel(day.date)}
      </p>

      <div className="my-2">
        <MiniSunArc day={day} />
      </div>

      <p className="font-display text-body font-medium text-ink-primary tabular-nums">
        {hasMorning ? formatTime(day.goldenHourMorningStart) : '—'}
      </p>
      <p className="font-display text-body font-medium text-ink-primary tabular-nums">
        {hasEvening ? formatTime(day.goldenHourEveningStart) : '—'}
      </p>
      <p className="mt-1 text-caption text-ink-secondary">
        {day.goldenHourTotalMinutes > 0
          ? formatDuration(day.goldenHourTotalMinutes * 60_000)
          : '—'}
      </p>
    </button>
  )
}

export default function ForecastStrip({
  forecast,
  selectedDayIndex,
  onSelectDay,
}: ForecastStripProps) {
  const referenceDate = forecast[0]?.date ?? new Date()
  const todayFullDate = formatTodayFullDate(referenceDate)

  return (
    <section>
      <header className="mb-6">
        <h2 className="font-display text-[20px] text-ink-primary lg:text-[24px]">
          the week ahead
        </h2>
        <p className="mt-1 text-body text-ink-secondary">{todayFullDate}</p>
      </header>

      <div className="-mx-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:overflow-visible lg:px-0">
        <div className="flex snap-x snap-mandatory gap-2 lg:grid lg:grid-cols-7 lg:gap-3 lg:snap-none">
          {forecast.map((day, index) => (
            <DayCard
              key={day.date.toISOString()}
              day={day}
              referenceDate={referenceDate}
              isSelected={index === selectedDayIndex}
              onSelect={() => onSelectDay(index)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
