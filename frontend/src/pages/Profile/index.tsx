import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/primitives/Input'
import { Textarea } from '@/components/primitives/Textarea'
import { Select } from '@/components/primitives/Select'
import { CardShimmer } from '@/components/feedback/LoadingShimmer'
import type { RiskTolerance } from '@/types'

interface Form {
  display_name: string
  financial_status: string
  financial_goals_text: string
  concerns: string
  risk_tolerance: RiskTolerance
  notes: string
  language: 'es' | 'en'
}

const empty: Form = {
  display_name: '',
  financial_status: '',
  financial_goals_text: '',
  concerns: '',
  risk_tolerance: 'moderate',
  notes: '',
  language: 'es',
}

export function ProfilePage() {
  const { t } = useTranslation()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const [form, setForm] = useState<Form>(empty)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (profile) {
      const lang = profile.language ?? 'es'
      setForm({
        display_name: profile.display_name ?? '',
        financial_status: profile.financial_status ?? '',
        financial_goals_text: profile.financial_goals_text ?? '',
        concerns: profile.concerns ?? '',
        risk_tolerance: profile.risk_tolerance,
        notes: profile.notes ?? '',
        language: lang,
      })
      i18n.changeLanguage(lang)
      setDirty(false)
    }
  }, [profile])

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }))
    setDirty(true)
  }

  const handleSave = () => {
    updateProfile.mutate(
      {
        display_name: form.display_name || null,
        financial_status: form.financial_status || null,
        financial_goals_text: form.financial_goals_text || null,
        concerns: form.concerns || null,
        risk_tolerance: form.risk_tolerance,
        notes: form.notes || null,
        language: form.language,
      },
      { onSuccess: () => setDirty(false) }
    )
  }

  if (isLoading) return (
    <div className="max-w-2xl space-y-4">
      <CardShimmer />
      <CardShimmer />
    </div>
  )

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-on-surface">{t('profile.title')}</h2>
        <p className="text-sm text-on-surface-variant mt-1">{t('profile.subtitle')}</p>
      </div>

      {/* Language selector */}
      <Card>
        <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-on-surface-variant">language</span>
          {t('profile.language')}
        </h3>
        <div className="flex gap-3">
          {(['es', 'en'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => { setForm(p => ({ ...p, language: lang })); setDirty(true); i18n.changeLanguage(lang) }}
              className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                form.language === lang
                  ? 'border-tertiary bg-tertiary/10 text-tertiary'
                  : 'border-outline/20 text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {lang === 'es' ? `🇲🇽 ${t('profile.languageEs')}` : `🇺🇸 ${t('profile.languageEn')}`}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-on-surface-variant">person</span>
          {t('profile.sections.basic')}
        </h3>
        <Input label={t('profile.nameLabel')} value={form.display_name} onChange={set('display_name')} placeholder={t('profile.namePlaceholder')} />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-on-surface-variant">account_balance_wallet</span>
          {t('profile.sections.situation')}
        </h3>
        <div className="space-y-4">
          <Textarea label={t('profile.situationLabel')} value={form.financial_status} onChange={set('financial_status')}
            placeholder={t('profile.situationPlaceholder')} rows={3} />
          <Select label={t('profile.riskTolerance')} value={form.risk_tolerance} onChange={set('risk_tolerance')}
            options={[
              { value: 'conservative', label: t('profile.riskLevels.conservative') },
              { value: 'moderate', label: t('profile.riskLevels.moderate') },
              { value: 'aggressive', label: t('profile.riskLevels.aggressive') },
            ]} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-on-surface-variant">flag</span>
          {t('profile.sections.goalsAndConcerns')}
        </h3>
        <div className="space-y-4">
          <Textarea label={t('profile.goalsLabel')} value={form.financial_goals_text} onChange={set('financial_goals_text')}
            placeholder={t('profile.goalsPlaceholder')} rows={3} />
          <Textarea label={t('profile.concernsLabel')} value={form.concerns} onChange={set('concerns')}
            placeholder={t('profile.concernsPlaceholder')} rows={3} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-on-surface-variant">note</span>
          {t('profile.sections.aiContext')}
        </h3>
        <Textarea label={t('profile.aiContextLabel')} value={form.notes} onChange={set('notes')}
          placeholder={t('profile.aiContextPlaceholder')} rows={3} />
      </Card>

      <div className="flex justify-end gap-3 pb-6">
        {dirty && <p className="text-xs text-on-surface-variant self-center">{t('profile.unsavedChanges')}</p>}
        <Button onClick={handleSave} loading={updateProfile.isPending} disabled={!dirty}>
          <span className="material-symbols-outlined text-sm">save</span>
          {t('profile.saveProfile')}
        </Button>
      </div>
    </div>
  )
}
