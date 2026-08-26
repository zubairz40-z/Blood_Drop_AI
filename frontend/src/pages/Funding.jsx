import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Server, Brain, Building2, Users, Shield, HandHeart, Code, Share2, Smartphone } from 'lucide-react'
import PublicNavbar from '../components/home/PublicNavbar'
import PublicFooter from '../components/home/PublicFooter'
import FadeIn from '../components/motion/FadeIn'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Alert from '../components/ui/Alert'

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
  const [searchParams] = useSearchParams()
  const initialAmount = searchParams.get('amount') || '500'
  const [selectedAmount, setSelectedAmount] = useState(
    amounts.includes(initialAmount) ? initialAmount : 'custom'
  )
  const [customAmount, setCustomAmount] = useState(
    amounts.includes(initialAmount) ? '' : initialAmount
  )
  const [processing, setProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState(null)
  const [error, setError] = useState(null)

  const effectiveAmount = selectedAmount === 'custom' ? customAmount : selectedAmount
  const parsedAmount = Number(effectiveAmount)

  async function handlePay() {
    if (!parsedAmount || parsedAmount < 1) {
      setError('Please enter a valid amount.')
      return
    }
    setProcessing(true)
    setError(null)
    setPaymentResult(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/bkash/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount, reference: 'Support BloodDrop' }),
      })
      const data = await res.json()
      if (data.success) {
        setPaymentResult(data)
      } else {
        setError(data.message || 'Payment could not be initiated.')
      }
    } catch {
      setError('bKash is not available in this environment. Please log in to make a payment.')
    } finally {
      setProcessing(false)
    }
  }

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

        {/* Financial Support — bKash */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <div className="p-8 bg-bg rounded-2xl border border-border">
                <h2 className="text-xl font-bold text-text-dark mb-3">Financial Support</h2>
                <p className="text-sm text-text-muted leading-relaxed mb-6">
                  Support BloodDrop AI and help us continue improving emergency blood donation coordination.
                </p>

                {paymentResult ? (
                  <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-sm font-semibold text-emerald-700 mb-2">Payment initiated</p>
                    {paymentResult.sandbox ? (
                      <p className="text-xs text-emerald-600">Sandbox mode — no real transaction occurred. This is a demo flow.</p>
                    ) : (
                      <p className="text-xs text-emerald-600">Redirecting to bKash...</p>
                    )}
                    <Button size="sm" variant="ghost" className="mt-3" onClick={() => setPaymentResult(null)}>Make another donation</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center gap-3 mb-4">
                      <span className="text-sm font-medium text-text-dark py-2">Payment Method:</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-full text-sm font-semibold text-pink-700">
                        <Smartphone className="w-4 h-4" /> bKash
                      </span>
                    </div>

                    <p className="text-xs text-text-muted mb-3">Amount</p>
                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                      {amounts.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setSelectedAmount(a)}
                          className={`w-24 py-3 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${selectedAmount === a ? 'border-brand bg-brand-soft text-brand' : 'border-border-dark bg-white text-text-dark hover:border-brand hover:text-brand'}`}
                        >
                          ৳{a}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedAmount('custom')}
                        className={`w-24 py-3 text-sm font-semibold rounded-xl border border-dashed transition-colors cursor-pointer ${selectedAmount === 'custom' ? 'border-brand bg-brand-soft text-brand' : 'border-border-dark bg-white text-text-muted hover:border-brand hover:text-brand'}`}
                      >
                        Custom
                      </button>
                    </div>

                    {selectedAmount === 'custom' && (
                      <div className="max-w-xs mx-auto mb-4">
                        <Input
                          label="Custom Amount (৳)"
                          name="customAmount"
                          type="number"
                          min="1"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter amount"
                        />
                      </div>
                    )}

                    {error && <Alert variant="error" className="text-xs mb-4">{error}</Alert>}

                    <Button
                      size="lg"
                      onClick={handlePay}
                      disabled={processing || !parsedAmount || parsedAmount < 1}
                      loading={processing}
                      className="px-8"
                    >
                      Continue with bKash
                    </Button>

                    <p className="text-[11px] text-text-muted mt-4">
                      Blood is never paid for. Donations support platform infrastructure and research.
                    </p>
                  </>
                )}
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
