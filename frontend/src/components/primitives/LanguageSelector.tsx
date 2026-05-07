import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'es', flag: '🇲🇽', label: 'Español' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
] as const

interface Props {
  /** When true renders as a compact flag-only button (for dark headers) */
  compact?: boolean
}

export function LanguageSelector({ compact = false }: Props) {
  const { i18n } = useTranslation()
  const current = LANGS.find(l => l.code === i18n.language) ?? LANGS[0]
  const next = LANGS.find(l => l.code !== i18n.language) ?? LANGS[1]

  const toggle = () => i18n.changeLanguage(next.code)

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={`Switch to ${next.label}`}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-neutral-700 hover:border-neutral-500 transition-colors text-neutral-300 hover:text-white"
      >
        <span>{current.flag}</span>
        <span className="text-xs font-medium">{current.code.toUpperCase()}</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      title={`Switch to ${next.label}`}
      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-black/25 hover:border-black/50 transition-colors"
    >
      <span>{current.flag}</span>
      <span className="text-xs font-medium">{current.code.toUpperCase()}</span>
    </button>
  )
}
