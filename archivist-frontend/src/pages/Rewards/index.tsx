import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useRewards, useMarkRewardsSeen, useUpdateRewardSettings } from '@/hooks/useRewards'
import { useUiStore } from '@/store/ui'
import type { RewardItem, RewardTier } from '@/types'

// ─── Tier config ──────────────────────────────────────────────────────────────

const TIER_COLORS: Record<RewardTier, string> = {
  bronze:  'border-amber-400 bg-amber-50 text-amber-800',
  silver:  'border-slate-300 bg-slate-50 text-slate-700',
  gold:    'border-yellow-400 bg-yellow-50 text-yellow-800',
  diamond: '',
}
const TIER_BADGE: Record<RewardTier, string> = {
  bronze:  'bg-amber-100 text-amber-700',
  silver:  'bg-slate-100 text-slate-600',
  gold:    'bg-yellow-100 text-yellow-700',
  diamond: 'bg-violet-100 text-violet-700',
}

// ─── Tilt wrapper ─────────────────────────────────────────────────────────────

function TiltCard({ children, className, style }: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-0.5, 0.5], [5, -5])
  const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5])

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => {
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 25 })
    animate(y, 0, { type: 'spring', stiffness: 300, damping: 25 })
  }

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 700, ...style }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Gold tilt card with mouse-tracked shine ──────────────────────────────────

function GoldTiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const rotateX = useTransform(y, [0, 1], [5, -5])
  const rotateY = useTransform(x, [0, 1], [-5, 5])
  const shineX = useTransform(x, [0, 1], [0, 100])
  const shineY = useTransform(y, [0, 1], [0, 100])
  const shineBg = useTransform(
    [shineX, shineY],
    ([sx, sy]) => `radial-gradient(ellipse at ${sx}% ${sy}%, rgba(255,220,80,0.45) 0%, rgba(255,200,50,0.15) 35%, transparent 65%)`
  )

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width)
    y.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => {
    animate(x, 0.5, { type: 'spring', stiffness: 300, damping: 25 })
    animate(y, 0.5, { type: 'spring', stiffness: 300, damping: 25 })
  }

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 700 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.div className="absolute inset-0 pointer-events-none rounded-xl z-10" style={{ background: shineBg }} />
      {children}
    </motion.div>
  )
}

// ─── Diamond tilt card (holographic) ─────────────────────────────────────────

function DiamondTiltCard({ children, earned }: { children: React.ReactNode; earned: boolean }) {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const rotateX = useTransform(y, [0, 1], [6, -6])
  const rotateY = useTransform(x, [0, 1], [-6, 6])
  const hue = useTransform(x, [0, 1], [220, 320])
  const rainbowBg = useTransform(
    [x, y, hue],
    ([mx, my, h]) =>
      `radial-gradient(ellipse at ${(mx as number) * 100}% ${(my as number) * 100}%, hsla(${h},100%,70%,0.45) 0%, hsla(${(h as number) + 60},100%,60%,0.25) 35%, transparent 65%)`
  )

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width)
    y.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => {
    animate(x, 0.5, { type: 'spring', stiffness: 300, damping: 25 })
    animate(y, 0.5, { type: 'spring', stiffness: 300, damping: 25 })
  }

  return (
    <motion.div
      className="rounded-xl p-[1.5px]"
      style={{
        background: 'linear-gradient(135deg,#a78bfa,#38bdf8,#f472b6,#34d399,#a78bfa)',
        rotateX,
        rotateY,
        transformPerspective: 700,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        className="relative overflow-hidden rounded-[10.5px] h-full"
        style={{ background: earned ? 'linear-gradient(135deg,#1e1b4b,#1e3a5f,#1e1b4b)' : 'linear-gradient(135deg,#18181b,#27272a,#18181b)' }}
      >
        <motion.div className="absolute inset-0 pointer-events-none z-10" style={{ background: rainbowBg }} />
        {children}
      </div>
    </motion.div>
  )
}

// ─── Reward card ──────────────────────────────────────────────────────────────

function RewardCard({ reward }: { reward: RewardItem }) {
  const { t } = useTranslation()
  const locked = !reward.earned
  const isDiamond = reward.tier === 'diamond'
  const isGold = reward.tier === 'gold'

  const name = isDiamond && !reward.earned
    ? reward.name
    : t(`rewards.keys.${reward.key}.name`, { defaultValue: reward.name })
  const description = isDiamond && !reward.earned
    ? '???'
    : t(`rewards.keys.${reward.key}.description`, { defaultValue: reward.description })
  const gift = isDiamond && !reward.earned
    ? '???'
    : t(`rewards.keys.${reward.key}.gift`, { defaultValue: reward.gift })

  const tierLabel = isDiamond ? '💎' : t(`rewards.tiers.${reward.tier}`, { earned: '', total: '' }).split(':')[0]

  if (isDiamond) {
    return (
      <DiamondTiltCard earned={reward.earned}>
        <div className="p-4">
          <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full ${reward.earned ? 'bg-violet-900/60 text-violet-200' : 'bg-zinc-800 text-zinc-400'}`}>
            {tierLabel}
          </span>
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">{reward.earned ? reward.icon : '🔒'}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${reward.earned ? 'text-violet-100' : 'text-zinc-400'}`}>{name}</p>
              <p className={`text-xs mt-0.5 ${reward.earned ? 'text-violet-300' : 'text-zinc-600'}`}>
                {reward.earned ? description : t('rewards.hiddenHint')}
              </p>
              {reward.earned ? (
                <div className="mt-2">
                  <p className="text-xs font-medium text-emerald-400">🎁 {t('rewards.gift')}: {gift}</p>
                  {reward.earned_at && (
                    <p className="text-xs text-zinc-500 mt-1">
                      {t('rewards.earnedOn', { date: new Date(reward.earned_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-600 mt-2 italic">{t('rewards.hiddenProgress')}</p>
              )}
            </div>
          </div>
        </div>
      </DiamondTiltCard>
    )
  }

  if (isGold) {
    return (
      <GoldTiltCard className={`rounded-xl border-2 p-4 ${locked ? 'border-zinc-200 bg-zinc-50 opacity-80' : 'border-yellow-400 bg-yellow-50'}`}>
        <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full capitalize z-20 ${locked ? 'bg-zinc-100 text-zinc-500' : TIER_BADGE.gold}`}>
          {tierLabel}
        </span>
        <div className="relative z-20 flex items-start gap-3">
          <span className="text-3xl leading-none">{reward.icon}</span>
          <CardBody reward={reward} name={name} description={description} gift={gift} locked={locked} />
        </div>
      </GoldTiltCard>
    )
  }

  return (
    <TiltCard className={`relative rounded-xl border-2 p-4 ${locked ? 'border-zinc-200 bg-zinc-50 opacity-80' : TIER_COLORS[reward.tier]}`}>
      <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${locked ? 'bg-zinc-100 text-zinc-500' : TIER_BADGE[reward.tier]}`}>
        {tierLabel}
      </span>
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none">{reward.icon}</span>
        <CardBody reward={reward} name={name} description={description} gift={gift} locked={locked} />
      </div>
    </TiltCard>
  )
}

function CardBody({ reward, name, description, gift, locked }: {
  reward: RewardItem; name: string; description: string; gift: string
  locked: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex-1 min-w-0">
      <p className={`font-semibold text-sm ${locked ? 'text-zinc-500' : ''}`}>{name}</p>
      <p className={`text-xs mt-0.5 ${locked ? 'text-zinc-400' : 'text-zinc-600'}`}>{description}</p>
      {reward.earned ? (
        <div className="mt-2">
          <p className="text-xs font-medium text-emerald-700">🎁 {t('rewards.gift')}: {gift}</p>
          {reward.earned_at && (
            <p className="text-xs text-zinc-400 mt-1">
              {t('rewards.earnedOn', { date: new Date(reward.earned_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) })}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{t('rewards.progress')}</span>
            <span>{reward.progress_pct.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(reward.progress_pct, 100)}%` }} />
          </div>
          <p className="text-xs text-zinc-400">🎁 {gift}</p>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useRewards()
  const markSeen = useMarkRewardsSeen()
  const updateSettings = useUpdateRewardSettings()
  const { showCelebration } = useUiStore()

  const DEMO_TIERS = ['bronze', 'silver', 'gold', 'diamond'] as const
  const demoIndexRef = useRef(0)
  const [demoTier, setDemoTier] = useState<typeof DEMO_TIERS[number]>('bronze')

  const triggerDemo = () => {
    const tier = DEMO_TIERS[demoIndexRef.current]
    const sample = data?.rewards.find(r => r.tier === tier) ?? data?.rewards[0]
    if (!sample) return
    showCelebration({
      type: 'reward',
      title: t(`rewards.keys.${sample.key}.name`, { defaultValue: sample.name }),
      subtitle: sample.gift !== '???' ? t(`rewards.keys.${sample.key}.gift`, { defaultValue: sample.gift }) : undefined,
      icon: sample.icon !== '🔒' ? sample.icon : '💎',
      tier,
    })
    const next = (demoIndexRef.current + 1) % DEMO_TIERS.length
    demoIndexRef.current = next
    setDemoTier(DEMO_TIERS[next])
  }

  useEffect(() => {
    if (data && data.unseen_count > 0) markSeen.mutate()
  }, [data?.unseen_count])

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <span className="text-zinc-400 text-sm">{t('rewards.loading')}</span>
    </div>
  )
  if (!data) return null

  const earned  = data.rewards.filter(r => r.earned)
  const pending = data.rewards.filter(r => !r.earned && r.tier !== 'diamond')
  const hidden  = data.rewards.filter(r => !r.earned && r.tier === 'diamond')

  const countByTier = (tier: RewardTier) => data.rewards.filter(r => r.tier === tier)

  const demoBtnStyle =
    demoTier === 'bronze'  ? 'border-amber-400 text-amber-600 hover:bg-amber-50' :
    demoTier === 'silver'  ? 'border-slate-400 text-slate-500 hover:bg-slate-50' :
    demoTier === 'gold'    ? 'border-yellow-400 text-yellow-600 hover:bg-yellow-50' :
                             'border-violet-400 text-violet-600 hover:bg-violet-50'
  const demoIcon = demoTier === 'bronze' ? '🥉' : demoTier === 'silver' ? '🥈' : demoTier === 'gold' ? '🥇' : '💎'

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t('rewards.title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('rewards.subtitle', { earned: data.earned_count, total: data.total_count })}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={triggerDemo}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed text-xs font-medium transition-colors ${demoBtnStyle}`}>
            {demoIcon} Demo {demoTier}
          </button>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-zinc-600">{t('rewards.enableSystem')}</span>
            <div onClick={() => updateSettings.mutate(!data.rewards_enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${data.rewards_enabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${data.rewards_enabled ? 'translate-x-5' : ''}`} />
            </div>
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <div className="w-full bg-zinc-100 rounded-full h-3">
          <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all"
            style={{ width: `${(data.earned_count / data.total_count) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-zinc-400">
          {(['bronze', 'silver', 'gold'] as RewardTier[]).map(tier => {
            const all = countByTier(tier)
            const earnedCount = all.filter(r => r.earned).length
            return <span key={tier}>{t(`rewards.tiers.${tier}`, { earned: earnedCount, total: all.length })}</span>
          })}
        </div>
      </div>

      {!data.rewards_enabled && (
        <div className="rounded-lg bg-zinc-100 border border-zinc-200 p-4 text-sm text-zinc-500 text-center">
          {t('rewards.disabled')}
        </div>
      )}

      {earned.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">{t('rewards.earned', { count: earned.length })}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {earned.map(r => <RewardCard key={r.key} reward={r} />)}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">{t('rewards.pending', { count: pending.length })}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pending.map(r => <RewardCard key={r.key} reward={r} />)}
          </div>
        </section>
      )}

      {hidden.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            💎 {t('rewards.hiddenSection')}
          </h2>
          <p className="text-xs text-zinc-400 mb-3">{t('rewards.hiddenSectionHint')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hidden.map(r => <RewardCard key={r.key} reward={r} />)}
          </div>
        </section>
      )}

      {earned.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-4xl mb-3">🎁</p>
          <p className="text-sm font-medium">{t('rewards.empty')}</p>
          <p className="text-xs mt-1">{t('rewards.emptyHint')}</p>
        </div>
      )}
    </div>
  )
}
