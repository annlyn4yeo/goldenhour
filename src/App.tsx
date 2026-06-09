import { useMemo, useState } from 'react'
import AppShell from './components/AppShell'
import ContentSection from './components/ContentSection'
import Footer from './components/Footer'
import HeroSection from './components/HeroSection'
import TopBar from './components/TopBar'
import useLocation from './hooks/useLocation'
import useSkyTheme from './hooks/useSkyTheme'
import useSunData, { getDisplaySunData } from './hooks/useSunData'

const FALLBACK_COORDS = { lat: 12.9716, lng: 77.5946 }

export default function App() {
  const { coords, cityName } = useLocation()
  const resolvedCoords = coords ?? FALLBACK_COORDS
  const sunData = useSunData({ coords: resolvedCoords })
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  const displaySunData = useMemo(
    () => getDisplaySunData(sunData, selectedDayIndex, resolvedCoords),
    [sunData, selectedDayIndex, resolvedCoords],
  )

  const { isLight } = useSkyTheme(sunData.currentSkyPhase)
  const isLiveDay = selectedDayIndex === 0

  return (
    <AppShell skyPhase={sunData.currentSkyPhase}>
      <TopBar locationName={cityName || 'Loading…'} />
      <HeroSection
        sunData={displaySunData}
        cityName={cityName}
        isLight={isLight}
        isLive={isLiveDay}
      />
      <ContentSection
        forecast={sunData.forecast}
        selectedDayIndex={selectedDayIndex}
        onSelectDay={setSelectedDayIndex}
        currentSkyPhase={displaySunData.currentSkyPhase}
      />
      <Footer />
    </AppShell>
  )
}
