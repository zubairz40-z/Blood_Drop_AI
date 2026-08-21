import PublicNavbar from '../components/home/PublicNavbar'
import HeroSection from '../components/home/HeroSection'
import SupportStrip from '../components/home/SupportStrip'
import HowItWorks from '../components/home/HowItWorks'
import DonationTypes from '../components/home/DonationTypes'
import AICoordinationSection from '../components/home/AICoordinationSection'
import DonorSection from '../components/home/DonorSection'
import HospitalSection from '../components/home/HospitalSection'
import StatsSection from '../components/home/StatsSection'
import SupportSection from '../components/home/SupportSection'
import EmergencyCTA from '../components/home/EmergencyCTA'
import PublicFooter from '../components/home/PublicFooter'

function Home() {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      <main>
        <HeroSection />
        <SupportStrip />
        <HowItWorks />
        <DonationTypes />
        <AICoordinationSection />
        <DonorSection />
        <HospitalSection />
        <StatsSection />
        <EmergencyCTA />
        <SupportSection />
      </main>
      <PublicFooter />
    </div>
  )
}

export default Home
