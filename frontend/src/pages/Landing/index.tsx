import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '@/components/primitives/LanguageSelector'

interface LandingPageProps {
  onGetStarted: () => void
  onSignIn: () => void
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const { t } = useTranslation()

  const features = [
    { icon: '🤖', title: t('landing.f1title'), desc: t('landing.f1desc') },
    { icon: '📄', title: t('landing.f2title'), desc: t('landing.f2desc') },
    { icon: '📊', title: t('landing.f3title'), desc: t('landing.f3desc') },
    { icon: '🏆', title: t('landing.f4title'), desc: t('landing.f4desc') },
  ]

  const stats = [
    { n: t('landing.stat1n'), label: t('landing.stat1l') },
    { n: t('landing.stat2n'), label: t('landing.stat2l') },
    { n: t('landing.stat3n'), label: t('landing.stat3l') },
    { n: t('landing.stat4n'), label: t('landing.stat4l') },
  ]

  const marqueeItems = [
    t('landing.m1'), t('landing.m2'), t('landing.m3'), t('landing.m4'),
    t('landing.m5'), t('landing.m6'), t('landing.m7'), t('landing.m8'),
  ]
  const repeated = [...marqueeItems, ...marqueeItems]

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#F2F1ED', color: '#1a1a1a' }}>

      {/* Announcement strip */}
      <div className="text-center py-2 text-xs tracking-wide" style={{ backgroundColor: '#1a1a1a', color: '#F2F1ED' }}>
        {t('landing.announcement')}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 h-14 border-b border-black/10" style={{ backgroundColor: '#F2F1ED' }}>
        <span className="font-serif text-lg font-medium tracking-tight">The Archivist</span>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button
            onClick={onSignIn}
            className="text-sm px-4 py-1.5 rounded-full border border-black/30 hover:border-black transition-colors"
          >
            {t('landing.signIn')}
          </button>
          <button
            onClick={onGetStarted}
            className="text-sm px-4 py-1.5 rounded-full text-[#F2F1ED] hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            {t('landing.getStarted')}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        <p className="text-xs uppercase tracking-[0.2em] mb-6 opacity-50">{t('landing.tagline')}</p>
        <h1
          className="font-serif font-light leading-tight mb-6"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', letterSpacing: '-0.03em', maxWidth: '820px' }}
        >
          {t('landing.heroLine1')}
          <br />
          <em>{t('landing.heroItalic')}</em> {t('landing.heroLine2')}
        </h1>
        <p className="text-base opacity-60 mb-10 max-w-md leading-relaxed">
          {t('landing.heroSubtext')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onGetStarted}
            className="px-8 py-3 rounded-full text-sm font-medium text-[#F2F1ED] hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            {t('landing.createFreeAccount')}
          </button>
          <button
            onClick={onSignIn}
            className="px-8 py-3 rounded-full text-sm font-medium border border-black/30 hover:border-black transition-colors"
          >
            {t('landing.signIn')}
          </button>
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-black/10 py-4 select-none">
        <div className="flex gap-10 whitespace-nowrap animate-marquee">
          {repeated.map((item, i) => (
            <span key={i} className="text-sm opacity-40 shrink-0">
              {item} <span className="opacity-40 mx-2">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 border-b border-black/10" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
        {stats.map(({ n, label }) => (
          <div key={label} className="flex flex-col items-center py-10 gap-1 border-r border-black/10 last:border-r-0">
            <span className="font-serif font-light opacity-90" style={{ fontSize: '2.5rem', letterSpacing: '-0.04em' }}>{n}</span>
            <span className="text-xs opacity-40 text-center">{label}</span>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 py-24 max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] opacity-40 mb-4">{t('landing.whatsIncluded')}</p>
        <h2
          className="font-serif font-light mb-16"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.025em' }}
        >
          {t('landing.featuresTitle1')}<br />{t('landing.featuresTitle2')}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-8 border border-black/10 hover:border-black/20 transition-colors"
              style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            >
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="font-medium text-base mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed opacity-55">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="mx-6 md:mx-12 mb-24 rounded-3xl px-8 py-20 flex flex-col items-center text-center"
        style={{ backgroundColor: '#1a1a1a', color: '#F2F1ED' }}
      >
        <h2
          className="font-serif font-light mb-4"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.025em' }}
        >
          {t('landing.ctaTitle')}
        </h2>
        <p className="text-sm opacity-50 mb-8 max-w-sm">{t('landing.ctaSubtext')}</p>
        <button
          onClick={onGetStarted}
          className="px-10 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#F2F1ED', color: '#1a1a1a' }}
        >
          {t('landing.ctaButton')}
        </button>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 pb-10 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-black/10 pt-8">
        <span className="font-serif text-sm opacity-60">The Archivist</span>
        <p className="text-xs opacity-35 text-center">
          © {new Date().getFullYear()} The Archivist. {t('landing.footerTagline')}
        </p>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <button onClick={onSignIn} className="text-xs opacity-50 hover:opacity-100 transition-opacity">{t('landing.signIn')}</button>
          <button onClick={onGetStarted} className="text-xs opacity-50 hover:opacity-100 transition-opacity">{t('landing.getStarted')}</button>
        </div>
      </footer>
    </div>
  )
}
