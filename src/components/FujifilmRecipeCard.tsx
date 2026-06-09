import { getFujifilmRecipe } from '../lib/fujifilmRecipes'
import type { LightSchedule } from '../lib/goldenHour'
import type { WeatherCategory } from '../lib/weather'

type FujifilmRecipeCardProps = {
  schedule: LightSchedule
  now: Date
  weather: WeatherCategory | null
}

type SettingRowProps = {
  label: string
  value: string
}

function SettingRow({ label, value }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-stone-900/5 px-4 py-3">
      <span className="text-sm text-stone-600">{label}</span>
      <span className="text-sm font-semibold text-stone-900">{value}</span>
    </div>
  )
}

export default function FujifilmRecipeCard({
  schedule,
  now,
  weather,
}: FujifilmRecipeCardProps) {
  const recipe = getFujifilmRecipe(schedule, now, weather ?? 'clear')

  return (
    <section className="rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
            Fujifilm recipe
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">
            {recipe.filmSimulation}
          </h2>
          <p className="mt-1 text-sm font-medium text-amber-700">
            {recipe.conditionLabel}
          </p>
        </div>
        <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {recipe.filmSimulation}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-stone-600">{recipe.description}</p>

      {!weather && (
        <p className="mt-4 rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-sm text-stone-600">
          Weather unavailable — recipe assumes clear skies.
        </p>
      )}

      <div className="mt-5 space-y-2">
        <SettingRow label="White balance" value={recipe.whiteBalance} />
        <SettingRow label="Highlights" value={recipe.highlights} />
        <SettingRow label="Shadows" value={recipe.shadows} />
      </div>
    </section>
  )
}
