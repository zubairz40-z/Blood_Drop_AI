import { Link } from 'react-router-dom'
import { Sparkles, Shield, MapPin } from 'lucide-react'
import authImage from '../../assets/login-register-image.jpg'

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] relative bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={authImage}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-neutral-900/60" />
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-brand/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-blood/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/blood-drop.png" alt="" className="w-7 h-7" />
            <span className="text-lg font-bold text-white">BloodDrop</span>
            <span className="text-[10px] font-bold bg-brand/20 text-brand px-1.5 py-0.5 rounded-full border border-brand/30">AI</span>
          </Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              Smarter coordination when every minute matters.
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed mb-8">
              BloodDrop AI connects patients, donors, and hospitals through intelligent multi-agent coordination.
            </p>
            <div className="space-y-4">
              {[
                { icon: Shield, text: 'Intelligent donor coordination' },
                { icon: MapPin, text: 'Location-based search' },
                { icon: Sparkles, text: 'Eligibility-aware matching' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-brand" />
                  </div>
                  <span className="text-sm text-neutral-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-neutral-600">
            BloodDrop AI — Intelligent Blood Donation Coordination
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-bg">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/blood-drop.png" alt="" className="w-7 h-7" />
              <span className="text-lg font-bold text-text-dark">BloodDrop</span>
              <span className="text-[10px] font-bold bg-brand-soft text-brand px-1.5 py-0.5 rounded-full">AI</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
