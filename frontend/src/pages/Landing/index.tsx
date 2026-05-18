import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '@/components/primitives/LanguageSelector'

interface Props { onGetStarted: () => void; onSignIn: () => void }

// ─── Mock App UI ──────────────────────────────────────────────────────────────

function MockOverviewCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-5 w-full max-w-xs select-none">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">October 2024</span>
        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">👤</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { l: 'Income', v: '$4,200', c: 'text-emerald-600' },
          { l: 'Expenses', v: '$2,340', c: 'text-red-500' },
          { l: 'Balance', v: '+$1,860', c: 'text-[#141414]' },
        ].map(k => (
          <div key={k.l} className="bg-gray-50 rounded-xl p-2 text-center">
            <div className="text-[9px] text-gray-400 mb-0.5">{k.l}</div>
            <div className={`text-xs font-bold ${k.c}`}>{k.v}</div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-gray-400 mb-2 font-medium">Recent</div>
      {[
        { e: '🍕', n: 'Chipotle', a: '-$14.50', cat: 'Food' },
        { e: '🛒', n: 'Walmart', a: '-$89.20', cat: 'Groceries' },
        { e: '💼', n: 'Payroll', a: '+$4,200', cat: 'Income' },
      ].map(tx => (
        <div key={tx.n} className="flex items-center justify-between py-1.5 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm">{tx.e}</span>
            <div>
              <div className="text-[11px] font-medium text-gray-800">{tx.n}</div>
              <div className="text-[9px] text-gray-400">{tx.cat}</div>
            </div>
          </div>
          <span className={`text-[11px] font-semibold ${tx.a.startsWith('+') ? 'text-emerald-600' : 'text-gray-600'}`}>{tx.a}</span>
        </div>
      ))}
    </div>
  )
}

function MockGoalCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-4 w-52 select-none">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Goals</div>
      {[
        { e: '🏖️', n: 'Vacation', pct: 72 },
        { e: '🚨', n: 'Emergency', pct: 48 },
        { e: '🏠', n: 'Down Payment', pct: 23 },
      ].map(g => (
        <div key={g.n} className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-gray-700">{g.e} {g.n}</span>
            <span className="text-[10px] font-semibold text-gray-500">{g.pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full">
            <div className="h-full bg-[#141414] rounded-full transition-all" style={{ width: `${g.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function MockAICard() {
  return (
    <div className="bg-[#141414] text-white rounded-2xl shadow-xl p-4 w-60 select-none">
      <div className="flex items-center gap-2 mb-2">
        <span>✨</span>
        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">AI Insight</span>
      </div>
      <p className="text-xs text-white/80 leading-relaxed">
        You've spent 18% less on dining this month. At this rate, you'll hit your Vacation goal 3 weeks early.
      </p>
    </div>
  )
}

// ─── Tab Mockups ──────────────────────────────────────────────────────────────

function ExpensesTabMock() {
  const items = [
    { e: '🍕', n: 'Chipotle', cat: 'Food', a: '-$14.50', d: 'Oct 15' },
    { e: '🛒', n: 'Walmart', cat: 'Groceries', a: '-$89.20', d: 'Oct 14' },
    { e: '⚡', n: 'Electric Bill', cat: 'Utilities', a: '-$120.00', d: 'Oct 12' },
    { e: '🎬', n: 'Netflix', cat: 'Entertainment', a: '-$15.99', d: 'Oct 10' },
    { e: '💊', n: 'Pharmacy', cat: 'Health', a: '-$34.50', d: 'Oct 8' },
    { e: '⛽', n: 'Shell', cat: 'Transport', a: '-$52.00', d: 'Oct 7' },
  ]
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-800">October 2024</span>
        <span className="text-sm font-bold text-red-500">-$326.19</span>
      </div>
      {items.map(tx => (
        <div key={tx.n + tx.d} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base">{tx.e}</div>
            <div>
              <div className="text-sm font-medium text-gray-800">{tx.n}</div>
              <div className="text-xs text-gray-400">{tx.cat} · {tx.d}</div>
            </div>
          </div>
          <span className="text-sm font-semibold text-gray-700">{tx.a}</span>
        </div>
      ))}
    </div>
  )
}

function BudgetTabMock() {
  const cats = [
    { n: 'Housing', budget: 1200, spent: 1200, c: 'bg-blue-500' },
    { n: 'Food', budget: 400, spent: 340, c: 'bg-emerald-500' },
    { n: 'Transport', budget: 250, spent: 180, c: 'bg-amber-500' },
    { n: 'Entertainment', budget: 150, spent: 95, c: 'bg-purple-500' },
    { n: 'Health', budget: 200, spent: 125, c: 'bg-rose-500' },
    { n: 'Savings', budget: 500, spent: 300, c: 'bg-teal-500' },
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-800">Budget vs Actual</span>
        <span className="text-xs text-gray-400">October 2024</span>
      </div>
      {cats.map(c => (
        <div key={c.n}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-700">{c.n}</span>
            <span className="text-xs text-gray-500">${c.spent} <span className="text-gray-300">/</span> ${c.budget}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${c.c} rounded-full transition-all`} style={{ width: `${Math.min(100, (c.spent / c.budget) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function GoalsTabMock() {
  const goals = [
    { e: '🏖️', n: 'Vacation Fund', current: 3600, target: 5000, pct: 72 },
    { e: '🚨', n: 'Emergency Fund', current: 4800, target: 10000, pct: 48 },
    { e: '🏠', n: 'Down Payment', current: 11500, target: 50000, pct: 23 },
  ]
  return (
    <div className="space-y-4">
      {goals.map(g => (
        <div key={g.n} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{g.e}</span>
              <div>
                <div className="text-sm font-semibold text-gray-800">{g.n}</div>
                <div className="text-xs text-gray-400">${g.current.toLocaleString()} of ${g.target.toLocaleString()}</div>
              </div>
            </div>
            <span className="text-lg font-bold text-gray-800">{g.pct}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#141414] rounded-full" style={{ width: `${g.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ReportsTabMock() {
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
  const values = [420, 680, 520, 890, 760, 1040]
  const max = Math.max(...values)
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-800">Net Balance Trend</span>
        <span className="text-xs font-semibold text-emerald-600">↑ 37% vs last month</span>
      </div>
      <div className="flex items-end gap-2 h-32 mb-3">
        {values.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-md transition-all ${i === values.length - 1 ? 'bg-[#141414]' : 'bg-gray-200'}`}
              style={{ height: `${(v / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        {months.map((m, i) => (
          <div key={m} className={`flex-1 text-center text-[10px] ${i === months.length - 1 ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>{m}</div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: 'Total Savings', v: '$12,400', d: '↑ 14%', c: 'text-emerald-600' },
          { l: 'Avg Monthly', v: '+$718', d: 'net', c: 'text-[#141414]' },
          { l: '12-mo Projection', v: '$21,016', d: 'on track', c: 'text-blue-600' },
        ].map(s => (
          <div key={s.l} className="bg-gray-50 rounded-xl p-2 text-center">
            <div className="text-[9px] text-gray-400">{s.l}</div>
            <div className={`text-xs font-bold ${s.c}`}>{s.v}</div>
            <div className="text-[9px] text-gray-400">{s.d}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────

function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <figure className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4">
      <blockquote className="text-sm text-gray-600 leading-relaxed flex-1">"{quote}"</blockquote>
      <figcaption className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
          {name[0]}
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-800">{name}</div>
          <div className="text-xs text-gray-400">{role}</div>
        </div>
      </figcaption>
    </figure>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

type Tab = 'expenses' | 'budget' | 'goals' | 'reports'

export function LandingPage({ onGetStarted, onSignIn }: Props) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('expenses')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'expenses', label: t('landing.tabExpenses') },
    { key: 'budget', label: t('landing.tabBudget') },
    { key: 'goals', label: t('landing.tabGoals') },
    { key: 'reports', label: t('landing.tabReports') },
  ]

  const tabContent: Record<Tab, React.ReactNode> = {
    expenses: <ExpensesTabMock />,
    budget: <BudgetTabMock />,
    goals: <GoalsTabMock />,
    reports: <ReportsTabMock />,
  }

  const stats = [
    { n: t('landing.stat1n'), l: t('landing.stat1l') },
    { n: t('landing.stat2n'), l: t('landing.stat2l') },
    { n: t('landing.stat3n'), l: t('landing.stat3l') },
    { n: t('landing.stat4n'), l: t('landing.stat4l') },
  ]

  const testimonials = [
    { q: t('landing.t1'), n: t('landing.t1name'), r: t('landing.t1role') },
    { q: t('landing.t2'), n: t('landing.t2name'), r: t('landing.t2role') },
    { q: t('landing.t3'), n: t('landing.t3name'), r: t('landing.t3role') },
    { q: t('landing.t4'), n: t('landing.t4name'), r: t('landing.t4role') },
    { q: t('landing.t5'), n: t('landing.t5name'), r: t('landing.t5role') },
    { q: t('landing.t6'), n: t('landing.t6name'), r: t('landing.t6role') },
  ]

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden" style={{ color: '#141414' }}>

      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 h-14 border-b border-gray-100"
        style={{ backgroundColor: 'rgba(237,237,237,0.72)', backdropFilter: 'blur(16px)' }}
      >
        <span className="font-heading font-bold text-base tracking-tight">The Archivist</span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block"><LanguageSelector /></span>
          <button
            onClick={onSignIn}
            className="hidden sm:block text-sm px-4 py-1.5 rounded-full hover:bg-black/5 transition-colors font-medium"
          >
            {t('landing.signIn')}
          </button>
          <button
            onClick={onGetStarted}
            className="text-sm px-4 py-1.5 rounded-full bg-[#141414] text-white hover:bg-black transition-colors font-medium"
          >
            {t('landing.getStarted')}
          </button>
        </div>
      </header>

      <main>

      {/* ── Hero ── */}
      <section className="px-6 md:px-12 pt-24 pb-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-500 font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t('landing.announcement')}
        </div>
        <h1
          className="font-heading font-extrabold leading-[1.05] mb-6 tracking-tight"
          style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)' }}
        >
          {t('landing.heroTitle')}
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
          {t('landing.heroSub')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
          <button
            onClick={onGetStarted}
            className="px-7 py-3 rounded-full bg-[#141414] text-white text-sm font-semibold hover:bg-black transition-colors"
          >
            {t('landing.createFreeAccount')}
          </button>
          <button
            onClick={onSignIn}
            className="px-7 py-3 rounded-full text-sm font-medium text-gray-600 hover:text-[#141414] flex items-center gap-1 transition-colors"
          >
            {t('landing.signIn')} <span>→</span>
          </button>
        </div>

        {/* Floating cards composition */}
        <div className="relative flex justify-center items-start gap-4">
          <div className="w-full max-w-xs md:w-auto md:-rotate-3 md:translate-y-4 transition-transform hover:rotate-0 hover:translate-y-0 duration-300">
            <MockOverviewCard />
          </div>
          <div className="hidden md:flex md:rotate-2 md:-translate-y-2 flex-col gap-3 transition-transform hover:rotate-0 hover:translate-y-0 duration-300">
            <MockGoalCard />
            <MockAICard />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {stats.map(({ n, l }, i) => (
            <div key={l} className={`flex flex-col items-center py-8 md:py-10 border-gray-100 ${
              i % 2 !== 1 ? 'border-r' : ''
            } md:border-r md:last:border-r-0 ${
              i < 2 ? 'border-b md:border-b-0' : ''
            }`}>
              <span className="font-heading font-black text-2xl md:text-4xl tracking-tight mb-1">{n}</span>
              <span className="text-xs text-gray-400 text-center px-3">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Tabs ── */}
      <section className="px-6 md:px-12 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="font-heading font-extrabold leading-tight mb-4 tracking-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
          >
            {t('landing.tabsTitle')}
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">{t('landing.tabsSub')}</p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center justify-center gap-1 mb-8 bg-gray-100 rounded-full p-1 w-fit mx-auto overflow-x-auto max-w-full">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-[#141414] shadow-sm'
                  : 'text-gray-500 hover:text-[#141414]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 md:p-8 max-w-2xl mx-auto min-h-[360px]">
          {tabContent[activeTab]}
        </div>
      </section>

      {/* ── Feature Section 1: Expense Tracking ── */}
      <section className="px-6 md:px-12 py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-gray-400 bg-gray-100 px-3 py-1 rounded-full mb-4">
              {t('landing.feat1Badge')}
            </span>
            <h2
              className="font-heading font-extrabold leading-tight mb-4 tracking-tight"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)' }}
            >
              {t('landing.feat1Title')}
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">{t('landing.feat1Desc')}</p>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 rounded-full bg-[#141414] text-white text-sm font-semibold hover:bg-black transition-colors"
            >
              {t('landing.createFreeAccount')}
            </button>
          </div>
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Expense log</div>
            <ExpensesTabMock />
          </div>
        </div>
      </section>

      {/* ── Feature Section 2: Budgeting ── */}
      <section className="px-6 md:px-12 py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Budget overview</div>
            <BudgetTabMock />
          </div>
          <div className="order-1 md:order-2">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-gray-400 bg-white px-3 py-1 rounded-full mb-4 border border-gray-100">
              {t('landing.feat2Badge')}
            </span>
            <h2
              className="font-heading font-extrabold leading-tight mb-4 tracking-tight"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)' }}
            >
              {t('landing.feat2Title')}
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">{t('landing.feat2Desc')}</p>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 rounded-full bg-[#141414] text-white text-sm font-semibold hover:bg-black transition-colors"
            >
              {t('landing.createFreeAccount')}
            </button>
          </div>
        </div>
      </section>

      {/* ── Feature Section 3: Goals ── */}
      <section className="px-6 md:px-12 py-24 border-b border-gray-100">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-gray-400 bg-gray-100 px-3 py-1 rounded-full mb-4">
              {t('landing.feat3Badge')}
            </span>
            <h2
              className="font-heading font-extrabold leading-tight mb-4 tracking-tight"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)' }}
            >
              {t('landing.feat3Title')}
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">{t('landing.feat3Desc')}</p>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 rounded-full bg-[#141414] text-white text-sm font-semibold hover:bg-black transition-colors"
            >
              {t('landing.createFreeAccount')}
            </button>
          </div>
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Savings goals</div>
            <GoalsTabMock />
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-6 md:px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <h2
            className="font-heading font-extrabold text-center mb-12 tracking-tight"
            style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)' }}
          >
            {t('landing.testimonialsTitle')}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map(({ q, n, r }) => (
              <TestimonialCard key={n} quote={q} name={n} role={r} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-5xl mx-auto bg-[#141414] rounded-3xl px-8 py-20 text-center">
          <h2
            className="font-heading font-extrabold text-white leading-tight mb-4 tracking-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            {t('landing.finalCtaTitle')}
          </h2>
          <p className="text-white/50 text-sm mb-8">{t('landing.finalCtaDesc')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="px-8 py-3 rounded-full bg-white text-[#141414] text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              {t('landing.ctaButton')}
            </button>
            <button
              onClick={onSignIn}
              className="px-8 py-3 rounded-full text-white/60 text-sm font-medium hover:text-white transition-colors"
            >
              {t('landing.signIn')} →
            </button>
          </div>
        </div>
      </section>

      </main>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-12 pb-10 pt-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-heading font-bold text-sm">The Archivist</span>
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} The Archivist. {t('landing.footerTagline')}
          </p>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <button onClick={onSignIn} className="text-xs text-gray-400 hover:text-[#141414] transition-colors">{t('landing.signIn')}</button>
            <button onClick={onGetStarted} className="text-xs text-gray-400 hover:text-[#141414] transition-colors">{t('landing.getStarted')}</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
