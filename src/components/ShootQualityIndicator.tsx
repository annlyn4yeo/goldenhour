import type { ShootQuality, ShootQualityRating } from '../lib/shootQuality'

type ShootQualityIndicatorProps = {
  quality: ShootQuality
}

const RATING_STYLES: Record<
  ShootQualityRating,
  { badge: string; dot: string }
> = {
  excellent: {
    badge: 'bg-emerald-100 text-emerald-900',
    dot: 'bg-emerald-500',
  },
  good: {
    badge: 'bg-amber-100 text-amber-900',
    dot: 'bg-amber-500',
  },
  fair: {
    badge: 'bg-orange-100 text-orange-900',
    dot: 'bg-orange-500',
  },
  poor: {
    badge: 'bg-stone-200 text-stone-700',
    dot: 'bg-stone-400',
  },
}

export default function ShootQualityIndicator({
  quality,
}: ShootQualityIndicatorProps) {
  const styles = RATING_STYLES[quality.rating]

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white/70 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone-700">Shoot quality</p>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles.badge}`}
        >
          <span className={`size-2 rounded-full ${styles.dot}`} aria-hidden />
          {quality.label}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-stone-600">{quality.reason}</p>
    </div>
  )
}
