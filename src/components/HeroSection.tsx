import type { SunData } from '../hooks/useSunData'
import SunArc from './SunArc'

type HeroSectionProps = {
  sunData: SunData
  cityName?: string
  isLight?: boolean
  isLive?: boolean
}

export default function HeroSection({
  sunData,
  cityName,
  isLight = false,
  isLive = true,
}: HeroSectionProps) {
  return (
    <section className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 pt-14 md:px-gutter">
      <SunArc sunData={sunData} cityName={cityName} isLight={isLight} isLive={isLive} />
    </section>
  )
}
