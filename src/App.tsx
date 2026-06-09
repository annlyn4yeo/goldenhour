import AppShell from './components/AppShell'
import ContentSection from './components/ContentSection'
import Footer from './components/Footer'
import HeroSection from './components/HeroSection'
import TopBar from './components/TopBar'
import useLocation from './hooks/useLocation'
import useSkyTheme from './hooks/useSkyTheme'
import useSunData from './hooks/useSunData'

const FALLBACK_COORDS = { lat: 12.9716, lng: 77.5946 }

export default function App() {
  const { coords, cityName } = useLocation()
  const sunData = useSunData({ coords: coords ?? FALLBACK_COORDS })
  const { isLight } = useSkyTheme(sunData.currentSkyPhase)

  return (
    <AppShell skyPhase={sunData.currentSkyPhase}>
      <TopBar locationName={cityName || 'Loading…'} />
      <HeroSection isLight={isLight} />
      <ContentSection />
      <Footer />
    </AppShell>
  )
}
