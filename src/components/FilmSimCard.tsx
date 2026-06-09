import { useEffect, useMemo, useState } from 'react'
import {
  getAlternateFilmSims,
  getBestFilmSim,
  SKY_PHASE_LABELS,
  type FilmSim,
} from '../data/filmSims'
import type { SkyPhase } from '../hooks/useSunData'
import type { WeatherCategory } from '../lib/weather'

type FilmSimCardProps = {
  currentSkyPhase: SkyPhase
  weather?: WeatherCategory | null
}

type SettingItemProps = {
  label: string
  value: string
}

function SettingItem({ label, value }: SettingItemProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-caption text-ink-tertiary">{label}</span>
      <span className="text-caption font-medium text-ink-primary">{value}</span>
    </div>
  )
}

function ColorSwatches({ colors }: { colors: FilmSim['colorProfile'] }) {
  return (
    <div className="flex items-center gap-2">
      {colors.map((hex) => (
        <span
          key={hex}
          className="h-8 w-8 rounded-full"
          style={{ backgroundColor: hex }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default function FilmSimCard({ currentSkyPhase, weather }: FilmSimCardProps) {
  const bestMatch = useMemo(
    () => getBestFilmSim(currentSkyPhase, weather),
    [currentSkyPhase, weather],
  )
  const [selectedSim, setSelectedSim] = useState<FilmSim>(bestMatch)

  useEffect(() => {
    setSelectedSim(bestMatch)
  }, [bestMatch])

  const alternates = useMemo(
    () => getAlternateFilmSims(currentSkyPhase, selectedSim.id, weather),
    [currentSkyPhase, selectedSim.id, weather],
  )

  const phaseLabel = SKY_PHASE_LABELS[currentSkyPhase]
  const settings = selectedSim.settings

  return (
    <div>
      <article className="rounded-2xl bg-surface-muted px-6 py-8 md:px-10 md:py-10">
        <p className="text-caption text-ink-tertiary">
          recommended for {phaseLabel}
        </p>

        <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <h2 className="font-display text-display leading-tight text-ink-primary">
              {selectedSim.name}
            </h2>
            <span className="mt-3 inline-block rounded-full bg-ink-primary/5 px-3 py-1 text-label font-medium tracking-wide text-ink-secondary uppercase">
              {selectedSim.mood}
            </span>
            <p className="mt-4 max-w-md text-body leading-relaxed text-ink-secondary">
              {selectedSim.description}
            </p>
          </div>

          <div className="flex flex-col gap-6 md:min-w-[200px]">
            <ColorSwatches colors={selectedSim.colorProfile} />
            <div className="grid gap-2">
              <SettingItem label="White balance" value={settings.whiteBalance} />
              <SettingItem label="Highlight" value={settings.highlight} />
              <SettingItem label="Shadow" value={settings.shadow} />
              <SettingItem label="Color" value={settings.color} />
              <SettingItem label="Sharpness" value={settings.sharpness} />
              <SettingItem label="Noise reduction" value={settings.noiseReduction} />
            </div>
          </div>
        </div>
      </article>

      {alternates.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 px-1">
          <span className="text-caption text-ink-tertiary">Also consider</span>
          {alternates.map((sim) => (
            <button
              key={sim.id}
              type="button"
              onClick={() => setSelectedSim(sim)}
              className="font-display text-body italic text-ink-secondary transition hover:text-ink-primary"
            >
              {sim.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
