import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { LanguageSelector } from '@/components/primitives/LanguageSelector'

interface LoginPageProps {
  initialMode?: 'login' | 'register'
  onBack?: () => void
}

export function LoginPage({ onBack }: LoginPageProps = {}) {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err: any) {
      setError(err.message || t('auth.somethingWentWrong'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <LanguageSelector compact />
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors mb-4 mx-auto"
            >
              {t('auth.backToHome')}
            </button>
          )}
          <h1 className="text-2xl font-semibold text-white">The Archivist</h1>
          <p className="mt-1 text-sm text-neutral-400">{t('auth.subtitle')}</p>
        </div>

        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">

          {/* Closed beta notice */}
          <div className="flex items-start gap-2.5 bg-amber-950/40 border border-amber-800/40 rounded-lg px-3 py-2.5 mb-5">
            <span className="text-amber-400 text-base mt-px">🔒</span>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              {t('auth.closedBeta')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">{t('auth.email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">{t('auth.password')}</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-medium rounded-lg py-2 text-sm hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('common.loading') : t('auth.enter')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
