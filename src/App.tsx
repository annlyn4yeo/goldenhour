import AppShell from './components/AppShell'
import ContentSection from './components/ContentSection'
import Footer from './components/Footer'
import HeroSection from './components/HeroSection'
import TopBar from './components/TopBar'

export default function App() {
  return (
    <AppShell skyPhase="goldenHour">
      <TopBar locationName="London, UK" />
      <HeroSection />
      <ContentSection />
      <Footer />
    </AppShell>
  )
}
