import { useMemo, useState } from 'react'
import AppShell from './components/AppShell'
import ContentSection from './components/ContentSection'
import Footer from './components/Footer'
import HeroSection from './components/HeroSection'
import LocationDrawer from './components/LocationDrawer'
import TopBar from './components/TopBar'
import useLocation from './hooks/useLocation'
import useSavedLocations from './hooks/useSavedLocations'
import useSkyTheme from './hooks/useSkyTheme'
import useSunData, { getDisplaySunData } from './hooks/useSunData'
import useWeather from './hooks/useWeather'

const FALLBACK_COORDS = { lat: 12.9716, lng: 77.5946 }

export default function App() {
  const { coords, cityName, isLoading: locationLoading } = useLocation()
  const seedLocation = useMemo(() => {
    if (!coords) return null
    return {
      lat: coords.lat,
      lng: coords.lng,
      name: cityName || `${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}`,
    }
  }, [coords, cityName])

  const {
    locations,
    addLocation,
    removeLocation,
    activeLocationId,
    activeLocation,
    setActiveLocation,
    hydrated,
  } = useSavedLocations({
    seedLocation,
    locationReady: !locationLoading,
  })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  const resolvedCoords = useMemo(() => {
    if (activeLocation) {
      return { lat: activeLocation.lat, lng: activeLocation.lng }
    }
    return coords ?? FALLBACK_COORDS
  }, [activeLocation, coords])

  const displayLocationName = activeLocation?.name || cityName || 'Loading…'

  const sunData = useSunData({ coords: resolvedCoords })
  const { weather, loading: weatherLoading, error: weatherError } = useWeather({
    coords: resolvedCoords,
  })

  const displaySunData = useMemo(
    () => getDisplaySunData(sunData, selectedDayIndex, resolvedCoords),
    [sunData, selectedDayIndex, resolvedCoords],
  )

  const { isLight, textClasses } = useSkyTheme(displaySunData.currentSkyPhase)
  const isLiveDay = selectedDayIndex === 0

  return (
    <div className="relative overflow-hidden">
      <AppShell skyPhase={sunData.currentSkyPhase}>
        <TopBar
          locationName={hydrated ? displayLocationName : 'Loading…'}
          onLocationClick={() => setDrawerOpen((open) => !open)}
          isLight={isLight}
          textClasses={textClasses}
        />
        <HeroSection
          sunData={displaySunData}
          cityName={displayLocationName}
          isLight={isLight}
          textClasses={textClasses}
          isLive={isLiveDay}
        />
        <ContentSection
          forecast={sunData.forecast}
          selectedDayIndex={selectedDayIndex}
          onSelectDay={setSelectedDayIndex}
          currentSkyPhase={displaySunData.currentSkyPhase}
          sunData={displaySunData}
          isLive={isLiveDay}
          weather={weather}
          weatherLoading={weatherLoading}
          weatherError={weatherError}
        />
        <Footer />
      </AppShell>

      <LocationDrawer
        open={drawerOpen}
        locations={locations}
        activeLocationId={activeLocationId}
        onSelect={(id) => {
          setActiveLocation(id)
          setDrawerOpen(false)
        }}
        onRemove={removeLocation}
        onAdd={addLocation}
      />
    </div>
  )
}
