import { useState } from 'react'
import { useReducedMotion, motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import { hospitalPartners } from '../../data/hospitals'

function HospitalCard({ name, logo }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="h-full flex items-center justify-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
      {imgError ? (
        <span className="text-xs text-neutral-400 text-center font-medium leading-snug">{name}</span>
      ) : (
        <img
          src={logo}
          alt={name}
          onError={() => setImgError(true)}
          className="max-h-10 max-w-full object-contain"
        />
      )}
    </div>
  )
}

function HospitalPartnersStrip() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className="w-full"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.6 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider whitespace-nowrap">
          Hospital Partners
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
        <Swiper
          modules={[Autoplay]}
          loop
          speed={2500}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          freeMode={{
            enabled: true,
            momentum: false,
          }}
          spaceBetween={12}
          slidesPerView={2.2}
          breakpoints={{
            480: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            1024: { slidesPerView: 5 },
            1280: { slidesPerView: 6 },
          }}
          className="hospital-swiper"
        >
          {hospitalPartners.map((h) => (
            <SwiperSlide key={h.id} className="!h-16">
              <HospitalCard name={h.name} logo={h.logo} />
            </SwiperSlide>
          ))}
          {hospitalPartners.map((h) => (
            <SwiperSlide key={`${h.id}-dup`} className="!h-16">
              <HospitalCard name={h.name} logo={h.logo} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </motion.div>
  )
}

export default HospitalPartnersStrip
