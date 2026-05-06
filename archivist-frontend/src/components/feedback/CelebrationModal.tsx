import { useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useUiStore } from '@/store/ui'

// ─── Particle system ──────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number
  vx: number; vy: number
  alpha: number; color: string
  radius: number; gravity: number
}

interface FxConfig {
  colors: string[]
  count: [number, number]
  speed: [number, number]
  radius: [number, number]
  gravity: number
  fadeRate: number
  intervalMs: number
  initialBursts: number
}

const FX: Record<'bronze' | 'silver' | 'gold' | 'diamond' | 'goal', FxConfig> = {
  bronze: {
    colors: ['#cd7f32', '#b8732a', '#ff8c00', '#ffa040', '#ff6347', '#e8a020', '#ffb347'],
    count: [55, 75], speed: [1.5, 4.5], radius: [2, 3.5],
    gravity: 0.09, fadeRate: 0.016, intervalMs: 700, initialBursts: 2,
  },
  silver: {
    colors: ['#c0c0c0', '#e0e0e0', '#ffffff', '#87ceeb', '#b0e0e6', '#dda0dd', '#9370db', '#add8e6'],
    count: [90, 120], speed: [2.5, 6.5], radius: [2, 4.5],
    gravity: 0.07, fadeRate: 0.012, intervalMs: 500, initialBursts: 4,
  },
  gold: {
    colors: ['#ffd700', '#ffcc00', '#ff8c00', '#ff4500', '#ffffff', '#fffacd',
             '#ff69b4', '#00ff7f', '#00bfff', '#ff6347', '#ffec00', '#ffa500'],
    count: [140, 180], speed: [3.5, 9], radius: [2.5, 5.5],
    gravity: 0.055, fadeRate: 0.009, intervalMs: 300, initialBursts: 6,
  },
  diamond: {
    colors: ['#a78bfa', '#818cf8', '#38bdf8', '#f472b6', '#34d399', '#fb923c',
             '#fbbf24', '#ffffff', '#c4b5fd', '#7dd3fc', '#6ee7b7', '#fde68a'],
    count: [190, 240], speed: [4, 11], radius: [2, 6],
    gravity: 0.04, fadeRate: 0.006, intervalMs: 180, initialBursts: 9,
  },
  goal: {
    colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b', '#ffffff', '#a7f3d0'],
    count: [70, 95], speed: [2, 5.5], radius: [2, 4],
    gravity: 0.08, fadeRate: 0.013, intervalMs: 600, initialBursts: 3,
  },
}

function burst(x: number, y: number, cfg: FxConfig, buf: Particle[]) {
  const count = cfg.count[0] + Math.floor(Math.random() * (cfg.count[1] - cfg.count[0]))
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = cfg.speed[0] + Math.random() * (cfg.speed[1] - cfg.speed[0])
    buf.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      alpha: 1,
      color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
      radius: cfg.radius[0] + Math.random() * (cfg.radius[1] - cfg.radius[0]),
      gravity: cfg.gravity + (Math.random() - 0.5) * 0.02,
    })
  }
}

function ringBurst(cx: number, cy: number, cfg: FxConfig, buf: Particle[]) {
  for (let i = 0; i < 36; i++) {
    const angle = (Math.PI * 2 * i) / 36
    const speed = 5 + Math.random() * 3
    buf.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
      radius: 3 + Math.random() * 2,
      gravity: cfg.gravity,
    })
  }
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

function FireworksCanvas({ active, fxKey }: { active: boolean; fxKey: keyof typeof FX }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>()
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const burstCountRef = useRef(0)
  const cfg = FX[fxKey]

  const launch = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const x = canvas.width * (0.1 + Math.random() * 0.8)
    const y = canvas.height * (0.08 + Math.random() * 0.55)
    burst(x, y, cfg, particlesRef.current)
    if (fxKey === 'gold' && burstCountRef.current % 3 === 0) {
      ringBurst(x, y, cfg, particlesRef.current)
    }
    burstCountRef.current++
  }, [cfg, fxKey])

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    for (let i = 0; i < cfg.initialBursts; i++) setTimeout(launch, i * 80)
    intervalRef.current = setInterval(launch, cfg.intervalMs)
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0.02)
      for (const p of particlesRef.current) {
        p.vy += p.gravity; p.vx *= 0.98; p.x += p.vx; p.y += p.vy; p.alpha -= cfg.fadeRate
        ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('resize', resize)
      clearInterval(intervalRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      particlesRef.current = []; burstCountRef.current = 0
    }
  }, [active, cfg, launch])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

// ─── Tier config ──────────────────────────────────────────────────────────────

const TIER_MEDAL: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', diamond: '💎', goal: '🎯',
}

const TIER_STYLE = {
  bronze: {
    badge: 'text-amber-700',
    card: 'border border-amber-300 bg-white',
    shadow: '0 25px 50px -12px rgba(180,100,0,0.25)',
    ring: 'ring-2 ring-amber-300/50',
    gift: 'bg-amber-50 border border-amber-100 text-amber-900',
    giftLabel: 'text-amber-700',
  },
  silver: {
    badge: 'text-slate-500',
    card: 'border border-slate-300 bg-white',
    shadow: '0 25px 50px -12px rgba(100,100,120,0.3)',
    ring: 'ring-2 ring-slate-300/50',
    gift: 'bg-slate-50 border border-slate-100 text-slate-800',
    giftLabel: 'text-slate-500',
  },
  gold: {
    badge: 'text-yellow-600',
    card: 'border-2 border-yellow-400',
    shadow: '0 25px 60px -8px rgba(234,179,8,0.5)',
    ring: 'ring-4 ring-yellow-300/60',
    gift: 'bg-yellow-50 border border-yellow-200 text-yellow-900',
    giftLabel: 'text-yellow-700',
  },
  diamond: {
    badge: 'text-violet-300',
    card: 'border-2 border-violet-500',
    shadow: '0 25px 70px -8px rgba(139,92,246,0.65)',
    ring: 'ring-4 ring-violet-400/50',
    gift: 'bg-violet-900/50 border border-violet-500/30 text-violet-100',
    giftLabel: 'text-violet-300',
  },
  goal: {
    badge: 'text-emerald-600',
    card: 'border border-emerald-200 bg-white',
    shadow: '0 25px 50px -12px rgba(16,185,129,0.2)',
    ring: 'ring-2 ring-emerald-300/40',
    gift: 'bg-emerald-50 border border-emerald-100 text-emerald-900',
    giftLabel: 'text-emerald-700',
  },
}

// ─── Tier backgrounds ─────────────────────────────────────────────────────────
const GOLD_BG    = 'linear-gradient(135deg, #fffdf0 0%, #fff9db 30%, #fffbf0 60%, #fef9e7 100%)'
const DIAMOND_BG = 'linear-gradient(135deg, #1e1b4b 0%, #1e3a5f 35%, #2d1b4b 65%, #1a1a2e 100%)'

// ─── Modal ────────────────────────────────────────────────────────────────────

export function CelebrationModal() {
  const { t } = useTranslation()
  const { celebration, hideCelebration } = useUiStore()
  const open = celebration !== null

  // Tilt — must be before early return (rules of hooks)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useTransform(my, [-0.5, 0.5], [12, -12])
  const rotateY = useTransform(mx, [-0.5, 0.5], [-12, 12])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(hideCelebration, 8000)
    return () => clearTimeout(t)
  }, [open, hideCelebration])

  if (!open || !celebration) return null

  const styleKey = celebration.tier ?? (celebration.type === 'goal' ? 'goal' : 'bronze')
  const fxKey = celebration.tier ?? 'goal'
  const style = TIER_STYLE[styleKey]
  const medal = TIER_MEDAL[styleKey]
  const isGold    = styleKey === 'gold'
  const isDiamond = styleKey === 'diamond'

  const cardAnimation = (isGold || isDiamond)
    ? 'pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both, float 1.8s ease-in-out 0.42s infinite'
    : 'pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both'

  const cardBg = isGold ? GOLD_BG : isDiamond ? DIAMOND_BG : undefined

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => {
    animate(mx, 0, { type: 'spring', stiffness: 300, damping: 25 })
    animate(my, 0, { type: 'spring', stiffness: 300, damping: 25 })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="absolute inset-0 pointer-events-none">
        <FireworksCanvas active={open} fxKey={fxKey} />
      </div>

      {/* Card */}
      <motion.div
        className={`relative z-10 mx-4 max-w-sm w-full rounded-3xl p-8 text-center overflow-hidden ${style.card} ${style.ring}`}
        style={{
          animation: cardAnimation,
          boxShadow: style.shadow,
          background: cardBg,
          rotateX,
          rotateY,
          transformPerspective: 800,
        }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {/* Gold shine overlay */}
        {isGold && (
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
              backgroundSize: '200% 100%',
              animation: 'shine 2.4s ease-in-out 0.5s infinite',
            }}
          />
        )}

        {/* Diamond holographic overlay */}
        {isDiamond && (
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              background: 'linear-gradient(105deg, transparent 20%, rgba(167,139,250,0.3) 40%, rgba(56,189,248,0.25) 55%, rgba(244,114,182,0.2) 70%, transparent 80%)',
              backgroundSize: '200% 100%',
              animation: 'shine 3s ease-in-out 0.5s infinite',
            }}
          />
        )}

        {/* Medal */}
        <div className="relative text-7xl mb-3 leading-none">{medal}</div>

        {/* Tier label */}
        <p className={`relative text-xs font-bold uppercase tracking-widest mb-1 ${style.badge}`}>
          {celebration.type === 'goal' ? t('celebration.goalReached') : t('celebration.rewardUnlocked')}
        </p>

        {/* Title */}
        <h2 className={`relative text-xl font-bold mb-1 ${isDiamond ? 'text-violet-100' : 'text-zinc-900'}`}>{celebration.title}</h2>

        {/* Reward icon */}
        {celebration.icon && (
          <p className="relative text-2xl mb-3">{celebration.icon}</p>
        )}

        {/* Gift */}
        {celebration.subtitle && (
          <div className={`relative rounded-xl px-4 py-3 mb-5 ${style.gift}`}>
            <p className={`text-xs font-semibold mb-0.5 ${style.giftLabel}`}>🎁 {t('celebration.yourGift')}</p>
            <p className="text-sm">{celebration.subtitle}</p>
          </div>
        )}

        <button
          onClick={hideCelebration}
          className="relative w-full py-3 rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-700 transition-colors"
        >
          {t('celebration.continue')}
        </button>
      </motion.div>
    </div>
  )
}
