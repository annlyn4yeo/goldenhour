import FilmSimCard from './FilmSimCard'
import type { SkyPhase } from '../hooks/useSunData'
import type { WeatherCategory } from '../lib/weather'

type ContentSectionProps = {
  currentSkyPhase: SkyPhase
  weather?: WeatherCategory | null
}

export default function ContentSection({
  currentSkyPhase,
  weather,
}: ContentSectionProps) {
  return (
    <section className="bg-surface-base px-4 py-section md:px-gutter">
      <div className="mx-auto max-w-[1200px]">
        <FilmSimCard currentSkyPhase={currentSkyPhase} weather={weather} />
      </div>
    </section>
  )
}
