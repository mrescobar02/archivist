import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Slide {
  id: string
  icon: string
  titleKey: string
  descKey: string
  fromColor: string
  toColor: string
  iconColor: string
  bgColor: string
}

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    icon: 'waving_hand',
    titleKey: 'tour.step1title',
    descKey: 'tour.step1desc',
    fromColor: '#e8f7f0',
    toColor: '#b8edd6',
    iconColor: '#006498',
    bgColor: 'rgba(0,100,152,0.12)',
  },
  {
    id: 'dashboard',
    icon: 'dashboard',
    titleKey: 'tour.step2title',
    descKey: 'tour.step2desc',
    fromColor: '#eef4ff',
    toColor: '#c7dbff',
    iconColor: '#3a65c2',
    bgColor: 'rgba(58,101,194,0.12)',
  },
  {
    id: 'expenses',
    icon: 'receipt_long',
    titleKey: 'tour.step3title',
    descKey: 'tour.step3desc',
    fromColor: '#f3eeff',
    toColor: '#d8c4ff',
    iconColor: '#7b4fcf',
    bgColor: 'rgba(123,79,207,0.12)',
  },
  {
    id: 'budget',
    icon: 'account_balance_wallet',
    titleKey: 'tour.step4title',
    descKey: 'tour.step4desc',
    fromColor: '#fff8e8',
    toColor: '#fde7a8',
    iconColor: '#b07600',
    bgColor: 'rgba(176,118,0,0.12)',
  },
  {
    id: 'savings',
    icon: 'savings',
    titleKey: 'tour.step5title',
    descKey: 'tour.step5desc',
    fromColor: '#fff0f0',
    toColor: '#ffc8c8',
    iconColor: '#b03060',
    bgColor: 'rgba(176,48,96,0.12)',
  },
  {
    id: 'ai',
    icon: 'auto_awesome',
    titleKey: 'tour.step6title',
    descKey: 'tour.step6desc',
    fromColor: '#eef0ff',
    toColor: '#c9ceff',
    iconColor: '#3040a0',
    bgColor: 'rgba(48,64,160,0.12)',
  },
]

function SlideIllustration({ slide }: { slide: Slide }) {
  return (
    <div
      className="aspect-video w-full rounded-xl flex flex-col items-center justify-center gap-4 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${slide.fromColor}, ${slide.toColor})` }}
    >
      {/* Decorative circles */}
      <div className="absolute top-4 right-6 w-20 h-20 rounded-full opacity-30" style={{ background: slide.iconColor }} />
      <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full opacity-20" style={{ background: slide.iconColor }} />

      {/* Icon container */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm relative z-10"
        style={{ background: slide.bgColor, border: `1px solid ${slide.iconColor}22` }}
      >
        <span
          className="material-symbols-outlined text-5xl"
          style={{ color: slide.iconColor, fontVariationSettings: "'FILL' 1" }}
        >
          {slide.icon}
        </span>
      </div>

      {/* Decorative lines */}
      <div className="flex flex-col gap-1.5 w-40 relative z-10">
        <div className="h-2 rounded-full opacity-30" style={{ background: slide.iconColor }} />
        <div className="h-2 rounded-full opacity-20 w-3/4" style={{ background: slide.iconColor }} />
      </div>
    </div>
  )
}

export function OnboardingTour() {
  const { t } = useTranslation()
  const [show, setShow] = useState<boolean | null>(null)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setShow(user?.user_metadata?.onboarding_done !== true)
    })
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on('select', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi])

  const finish = async () => {
    setShow(false)
    await supabase.auth.updateUser({ data: { onboarding_done: true } })
  }

  if (!show) return null

  const isFirst = activeIndex === 0
  const isLast = activeIndex === SLIDES.length - 1
  const current = SLIDES[activeIndex]

  const handleNext = () => isLast ? finish() : emblaApi?.scrollNext()
  const handlePrev = () => emblaApi?.scrollPrev()

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={finish} />

      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl bg-surface-container-lowest shadow-2xl overflow-hidden animate-pop">
        <div className="p-4">

          {/* Carousel */}
          <div ref={emblaRef} className="overflow-hidden rounded-xl">
            <div className="flex">
              {SLIDES.map(slide => (
                <div key={slide.id} className="flex-[0_0_100%] min-w-0">
                  <SlideIllustration slide={slide} />
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {SLIDES.map((slide, i) => (
              <motion.div
                key={slide.id}
                animate={{ opacity: i === activeIndex ? 1 : 0.4, width: i === activeIndex ? 24 : 8 }}
                initial={false}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="h-2"
              >
                <button
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={t(slide.titleKey)}
                  className={cn(
                    'h-2 w-full rounded-full transition-colors cursor-pointer',
                    i === activeIndex ? 'bg-on-surface' : 'bg-outline-variant hover:bg-on-surface-variant'
                  )}
                />
              </motion.div>
            ))}
          </div>

          {/* Title + Description — grid crossfade */}
          <div className="grid mt-4 px-1 min-h-[88px]">
            {SLIDES.map(slide => (
              <motion.div
                key={slide.id}
                animate={{ opacity: current.id === slide.id ? 1 : 0 }}
                initial={false}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="col-start-1 row-start-1"
                style={{ pointerEvents: current.id === slide.id ? 'auto' : 'none' }}
              >
                <h2 className="font-heading text-base font-bold text-on-surface">{t(slide.titleKey)}</h2>
                <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">{t(slide.descKey)}</p>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-5 px-1">
            <div className="w-16">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                >
                  {t('tour.back')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isLast && (
                <button
                  onClick={finish}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                >
                  {t('tour.skip')}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-5 py-1.5 rounded-xl bg-on-surface text-surface-container-lowest text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                {isLast ? t('tour.finish') : t('tour.next')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
