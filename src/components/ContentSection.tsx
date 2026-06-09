import type { SunDayData, SkyPhase } from '../hooks/useSunData'
import FilmSimCard from './FilmSimCard'
import ForecastStrip from './ForecastStrip'
import type { WeatherCategory } from '../lib/weather'

type ContentSectionProps = {
  forecast: SunDayData[]
  selectedDayIndex: number
  onSelectDay: (index: number) => void
  currentSkyPhase: SkyPhase
  weather?: WeatherCategory | null
}

export default function ContentSection({
  forecast,
  selectedDayIndex,
  onSelectDay,
  currentSkyPhase,
  weather,
}: ContentSectionProps) {
  return (
    <section className="bg-surface-base px-4 py-section md:px-gutter">
      <div className="mx-auto max-w-[1200px]">
        <ForecastStrip
          forecast={forecast}
          selectedDayIndex={selectedDayIndex}
          onSelectDay={onSelectDay}
        />
        <FilmSimCard currentSkyPhase={currentSkyPhase} weather={weather} />
      </div>
    </section>
  )
}
