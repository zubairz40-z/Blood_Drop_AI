import { Link } from 'react-router-dom'
import { ArrowRight, Server, Brain, Building2, Users, Shield, HandHeart, Code, Share2 } from 'lucide-react'
import PublicNavbar from '../components/home/PublicNavbar'
import PublicFooter from '../components/home/PublicFooter'
import FadeIn from '../components/motion/FadeIn'

const useCases = [
  {
    icon: Server,
    title: 'Platform Infrastructure',
    description: 'Support hosting, database, notification, and reliability infrastructure needed for future deployment.',
  },
  {
    icon: Brain,
    title: 'AI & Coordination Research',
    description: 'Support continued development and validation of donor matching, scheduling, geo coordination, and risk systems.',
  },
  {
    icon: Building2,
    title: 'Hospital & Community Integration',
    description: 'Help prepare the platform for responsible collaboration with hospitals and blood-donation organizations.',
  },
  {
    icon: Users,
    title: 'Volunteer & Awareness Programs',
    description: 'Support community outreach and volunteer coordination around blood donation.',
  },
]

const enableItems = [
  'Secure backend infrastructure',
  'Reliable notification delivery',
  'Geospatial coordination',
  'Responsible AI system development',
  'Testing and monitoring',
  'Community outreach',
]

const supportMethods = [
  {
    icon: Shield,
    title: 'Research Support',
    description: 'Contribute to academic research on AI-powered healthcare coordination and donor matching.',
  },
  {
    icon: Code,
    title: 'Technical Contribution',
    description: 'Help develop open-source components for the BloodDrop platform.',
  },
  {
    icon: HandHeart,
    title: 'Community Partnership',
    description: 'Collaborate with BloodDrop through hospitals, blood banks, or community organizations.',
  },
  {
    icon: Share2,
    title: 'Spread Awareness',
    description: 'Share BloodDrop with your community to grow the donor and volunteer network.',
  },
]

const waysToHelp = [
  { label: 'Become a donor', to: '/register', icon: 'Register as a donor on BloodDrop to be matched when someone nearby needs help.' },
  { label: 'Volunteer', to: '/register', icon: 'Sign up as a volunteer to assist with donor-hospital coordination.' },
  { label: 'Explore BloodDrop', to: '/', icon: 'Learn how AI-powered coordination works for blood donation.' },
]

function Funding() {
  return (
    <div className="min-h-screen">
      <PublicNavbar />

      <main className="pt-16">
        {/* Hero */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-3">Support</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-text-dark mb-5 leading-tight">
                Support faster blood coordination
              </h1>
              <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed mb-8">
                Help BloodDrop AI grow from a university project into a stronger platform for donor, hospital, volunteer, and emergency coordination.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href="#why-support" className="inline-flex items-center gap-2 px-7 py-3 text-base font-medium rounded-full bg-brand text-white hover:bg-brand-hover transition-colors shadow-sm">
                  How Support Helps
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link to="/" className="inline-flex items-center gap-2 px-7 py-3 text-base font-medium rounded-full border border-border-dark text-text-dark hover:bg-neutral-50 transition-colors">
                  Explore the Project
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Why Support */}
        <section id="why-support" className="py-16 sm:py-20 bg-bg scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-12">
              <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Why Support</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">Where support makes a difference</h2>
              <p className="text-text-muted max-w-xl mx-auto">
                BloodDrop AI is an open coordination platform. Support helps develop the infrastructure and research needed for responsible growth.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {useCases.map((item, i) => {
                const Icon = item.icon
                return (
                  <FadeIn key={item.title} delay={i * 0.08}>
                    <div className="p-6 bg-white rounded-2xl border border-border shadow-card hover:shadow-elevated transition-shadow h-full">
                      <div className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5 text-brand" />
                      </div>
                      <h3 className="text-base font-semibold text-text-dark mb-2">{item.title}</h3>
                      <p className="text-sm text-text-muted leading-relaxed">{item.description}</p>
                    </div>
                  </FadeIn>
                )
              })}
            </div>
          </div>
        </section>

        {/* What Support Can Enable */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10">
              <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Impact</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">What support can enable</h2>
            </FadeIn>

            <FadeIn>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {enableItems.map((item) => (
                  <div key={item} className="flex items-center gap-3 p-4 bg-bg rounded-xl border border-border">
                    <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
                    <span className="text-sm text-text-dark font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Project Status */}
        <section className="py-16 sm:py-20 bg-bg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="p-8 bg-white rounded-2xl border border-border shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-brand" />
                  <h2 className="text-xl font-bold text-text-dark">Project Status</h2>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  BloodDrop AI is currently being developed as a university project. The interface and workflows shown on this website are prototype/demo functionality and are not connected to live healthcare infrastructure.
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Any future funding integration should include clear records of how funds are used for development, infrastructure, research, and community initiatives.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Ways to Help */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10">
              <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Get Involved</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">Ways to help</h2>
              <p className="text-text-muted max-w-lg mx-auto">
                Non-financial ways to support BloodDrop AI and its mission.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {waysToHelp.map((item, i) => (
                <FadeIn key={item.label} delay={i * 0.08}>
                  <Link
                    to={item.to}
                    className="block p-6 bg-bg rounded-2xl border border-border hover:shadow-elevated transition-all h-full"
                  >
                    <h3 className="text-base font-semibold text-text-dark mb-2">{item.label}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{item.icon}</p>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Support Methods */}
        <section className="py-16 sm:py-20 bg-bg">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10">
              <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Support Options</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">How you can contribute</h2>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {supportMethods.map((item, i) => {
                const Icon = item.icon
                return (
                  <FadeIn key={item.title} delay={i * 0.08}>
                    <div className="p-6 bg-white rounded-2xl border border-border shadow-card h-full">
                      <div className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5 text-brand" />
                      </div>
                      <h3 className="text-base font-semibold text-text-dark mb-2">{item.title}</h3>
                      <p className="text-sm text-text-muted leading-relaxed">{item.description}</p>
                    </div>
                  </FadeIn>
                )
              })}
            </div>
          </div>
        </section>

        {/* Financial Support placeholder */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <div className="p-8 bg-bg rounded-2xl border border-border">
                <h2 className="text-xl font-bold text-text-dark mb-3">Financial Support</h2>
                <p className="text-sm text-text-muted leading-relaxed mb-5">
                  Payment integration will be available in a later deployment phase. BloodDrop AI does not currently accept direct financial contributions.
                </p>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-100 text-text-secondary text-sm font-medium">
                  Funding Integration Planned
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 bg-bg">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <h2 className="text-3xl font-bold text-text-dark mb-4">Ready to explore BloodDrop AI?</h2>
              <p className="text-text-muted mb-8 max-w-lg mx-auto">
                Experience the prototype platform and see how AI-powered coordination could support faster blood donation workflows.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/" className="inline-flex items-center gap-2 px-7 py-3 text-base font-medium rounded-full bg-brand text-white hover:bg-brand-hover transition-colors shadow-sm">
                  Explore the Project
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3 text-base font-medium rounded-full border border-border-dark text-text-dark hover:bg-neutral-50 transition-colors">
                  Register
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

export default Funding
