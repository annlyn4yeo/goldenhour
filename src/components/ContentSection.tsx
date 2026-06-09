import type { SunDayData, SkyPhase } from '../hooks/useSunData'
import {
  weatherConditionToCategory,
  type WeatherData,
} from '../hooks/useWeather'
import FilmSimCard from './FilmSimCard'
import ForecastStrip from './ForecastStrip'
import LightTimeline from './LightTimeline'
import ShootQualityCard from './ShootQualityCard'
import type { WeatherCategory } from '../lib/weather'

type ContentSectionProps = {
  forecast: SunDayData[]
  selectedDayIndex: number
  onSelectDay: (index: number) => void
  currentSkyPhase: SkyPhase
  sunData: SunDayData
  isLive?: boolean
  weather?: WeatherData | null
  weatherLoading?: boolean
  weatherError?: string | null
}

export default function ContentSection({
  forecast,
  selectedDayIndex,
  onSelectDay,
  currentSkyPhase,
  sunData,
  isLive = false,
  weather,
  weatherLoading,
  weatherError,
}: ContentSectionProps) {
  const isGoldenHour =
    currentSkyPhase === 'goldenHourMorning' || currentSkyPhase === 'goldenHourEvening'

  const weatherCategory: WeatherCategory | null = weather
    ? weatherConditionToCategory(weather.condition)
    : null

  return (
    <section className="bg-surface-base px-4 py-section md:px-gutter">
      <div className="mx-auto max-w-[1200px]">
        <ForecastStrip
          forecast={forecast}
          selectedDayIndex={selectedDayIndex}
          onSelectDay={onSelectDay}
        />
        <ShootQualityCard
          weather={weather ?? null}
          isGoldenHour={isGoldenHour}
          loading={weatherLoading}
          error={weatherError}
        />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">
          <FilmSimCard currentSkyPhase={currentSkyPhase} weather={weatherCategory} />
          <LightTimeline sunData={sunData} isLive={isLive} />
        </div>
      </div>
    </section>
  )
}
