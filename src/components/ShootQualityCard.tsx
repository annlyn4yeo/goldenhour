import type { WeatherData } from '../hooks/useWeather'
import {
  computeShootScore,
  getConditionLabel,
  getLensRecommendation,
} from '../utils/shootScore'

type ShootQualityCardProps = {
  weather: WeatherData | null
  isGoldenHour: boolean
  loading?: boolean
  error?: string | null
}

function formatVisibility(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(meters >= 10_000 ? 0 : 1)} km`
  }
  return `${Math.round(meters)} m`
}

function formatWind(kmh: number): string {
  return `${Math.round(kmh)} km/h`
}

export default function ShootQualityCard({
  weather,
  isGoldenHour,
  loading,
  error,
}: ShootQualityCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-surface-muted px-6 py-8 md:px-10">
        <p className="text-caption text-ink-tertiary">Loading shoot conditions…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-surface-border bg-surface-muted px-6 py-8 md:px-10">
        <p className="text-caption font-medium text-ink-primary">Shoot score unavailable</p>
        <p className="mt-1 text-caption text-ink-secondary">{error}</p>
      </div>
    )
  }

  if (!weather) return null

  const { score, verdict } = computeShootScore(weather, isGoldenHour)
  const lensTip = getLensRecommendation(weather.condition)

  return (
    <article className="rounded-2xl bg-surface-muted px-6 py-8 md:px-10">
      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
        <div className="flex flex-col">
          <span className="font-display text-display leading-none text-ink-primary">
            {score.toFixed(1)}
          </span>
          <span className="mt-2 text-caption text-ink-tertiary">shoot score</span>
        </div>

        <div className="grid gap-2">
          <StatRow label="Conditions" value={getConditionLabel(weather.condition)} />
          <StatRow label="Wind" value={formatWind(weather.windSpeed)} />
          <StatRow label="Visibility" value={formatVisibility(weather.visibility)} />
        </div>
      </div>

      <p className="mt-6 text-body italic text-ink-secondary">{verdict}</p>

      <p className="mt-4 text-caption leading-relaxed text-ink-tertiary">{lensTip}</p>
    </article>
  )
}

type StatRowProps = {
  label: string
  value: string
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-caption text-ink-tertiary">{label}</span>
      <span className="text-caption font-medium text-ink-primary">{value}</span>
    </div>
  )
}
