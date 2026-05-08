import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

interface Step {
  icon: string
  titleKey: string
  descKey: string
  color: string
}

const STEPS: Step[] = [
  { icon: 'waving_hand',            titleKey: 'tour.step1title', descKey: 'tour.step1desc', color: 'text-emerald-500' },
  { icon: 'dashboard',              titleKey: 'tour.step2title', descKey: 'tour.step2desc', color: 'text-blue-500' },
  { icon: 'receipt_long',           titleKey: 'tour.step3title', descKey: 'tour.step3desc', color: 'text-violet-500' },
  { icon: 'account_balance_wallet', titleKey: 'tour.step4title', descKey: 'tour.step4desc', color: 'text-amber-500' },
  { icon: 'savings',                titleKey: 'tour.step5title', descKey: 'tour.step5desc', color: 'text-rose-500' },
  { icon: 'auto_awesome',           titleKey: 'tour.step6title', descKey: 'tour.step6desc', color: 'text-indigo-500' },
]

export function OnboardingTour() {
  const { t } = useTranslation()
  const [show, setShow] = useState<boolean | null>(null) // null = loading
  const [step, setStep] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setShow(user?.user_metadata?.onboarding_done !== true)
    })
  }, [])

  const finish = async () => {
    setShow(false)
    await supabase.auth.updateUser({ data: { onboarding_done: true } })
  }

  if (!show) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">

          {/* Progress bar */}
          <div className="h-1 bg-neutral-100">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="px-8 py-8 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center">
                <span className={`material-symbols-outlined text-4xl ${current.color}`}>
                  {current.icon}
                </span>
              </div>
            </div>

            {/* Content */}
            <h2 className="text-lg font-bold text-neutral-900 mb-2">
              {t(current.titleKey)}
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-8">
              {t(current.descKey)}
            </p>

            {/* Step dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`block rounded-full transition-all duration-200 ${
                    i === step
                      ? 'w-4 h-1.5 bg-neutral-900'
                      : i < step
                      ? 'w-1.5 h-1.5 bg-emerald-400'
                      : 'w-1.5 h-1.5 bg-neutral-200'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  {t('tour.back')}
                </button>
              )}
              <button
                onClick={isLast ? finish : () => setStep(s => s + 1)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors"
              >
                {isLast ? t('tour.finish') : t('tour.next')}
              </button>
            </div>

            {!isLast && (
              <button
                onClick={finish}
                className="mt-4 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {t('tour.skip')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
