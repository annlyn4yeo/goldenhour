import type { SunDayData, SkyPhase } from '../hooks/useSunData'
import {
  weatherConditionToCategory,
  type WeatherData,
} from '../hooks/useWeather'
import FilmSimCard from './FilmSimCard'
import ForecastStrip from './ForecastStrip'
import LightTimeline from './LightTimeline'
import ReminderWidget from './ReminderWidget'
import ShareCard from './ShareCard'
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
    <section className="border-surface-border bg-surface-base px-4 pt-16 pb-20 md:px-gutter lg:border-t-[0.5px]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-12 gap-6 min-[1400px]:max-w-[1320px]">
        <div className="col-span-12">
          <ForecastStrip
            forecast={forecast}
            selectedDayIndex={selectedDayIndex}
            onSelectDay={onSelectDay}
          />
        </div>

        <div className="col-span-12 md:col-span-12 lg:col-span-7">
          <FilmSimCard currentSkyPhase={currentSkyPhase} weather={weatherCategory} />
        </div>

        <div className="col-span-12 md:col-span-6 lg:col-span-5">
          <LightTimeline sunData={sunData} isLive={isLive} />
        </div>

        <div className="col-span-12 md:col-span-12 lg:col-span-7">
          <ReminderWidget />
        </div>

        <div className="col-span-12 md:col-span-6 lg:col-span-5 lg:col-start-8">
          <ShootQualityCard
            weather={weather ?? null}
            isGoldenHour={isGoldenHour}
            loading={weatherLoading}
            error={weatherError}
          />
        </div>

        <div className="col-span-12">
          <ShareCard />
        </div>
      </div>
    </section>
  )
}
