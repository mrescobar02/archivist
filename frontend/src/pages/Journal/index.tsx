import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useJournalEntries, useCreateJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry } from '@/hooks/useJournal'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { Modal } from '@/components/primitives/Modal'
import { Input } from '@/components/primitives/Input'
import { Textarea } from '@/components/primitives/Textarea'
import { CardShimmer } from '@/components/feedback/LoadingShimmer'
import { ErrorState } from '@/components/feedback/ErrorState'
import type { JournalEntry, JournalMood } from '@/types'

const MOOD_META: { value: JournalMood; emoji: string; color: string; key: string }[] = [
  { value: 'stressed', emoji: '😰', color: 'text-error bg-error/10', key: 'stressed' },
  { value: 'neutral',  emoji: '😐', color: 'text-on-surface-variant bg-surface-container', key: 'neutral' },
  { value: 'positive', emoji: '😊', color: 'text-success bg-success/10', key: 'positive' },
]

function moodMeta(mood: string | null) {
  return MOOD_META.find(m => m.value === mood) ?? MOOD_META[1]
}

interface EntryForm { title: string; content: string; mood: JournalMood | null }
const emptyForm: EntryForm = { title: '', content: '', mood: null }

export function JournalPage() {
  const { t } = useTranslation()

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return t('journal.timeAgo.minutes', { n: mins })
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return t('journal.timeAgo.hours', { n: hrs })
    const days = Math.floor(hrs / 24)
    if (days === 1) return t('journal.timeAgo.yesterday')
    if (days < 7) return t('journal.timeAgo.days', { n: days })
    return new Date(dateStr).toLocaleDateString(t('journal.timeAgo.locale', { defaultValue: 'es' }), { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const { data: entries, isLoading, error, refetch } = useJournalEntries()
  const createEntry = useCreateJournalEntry()
  const updateEntry = useUpdateJournalEntry()
  const deleteEntry = useDeleteJournalEntry()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<JournalEntry | null>(null)
  const [form, setForm] = useState<EntryForm>(emptyForm)
  const [expanded, setExpanded] = useState<number | null>(null)

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (e: JournalEntry) => {
    setEditing(e)
    setForm({ title: e.title, content: e.content, mood: e.mood as JournalMood | null })
    setOpen(true)
  }

  const handleSubmit = () => {
    const payload = { title: form.title, content: form.content, mood: form.mood }
    if (editing) {
      updateEntry.mutate({ id: editing.id, data: payload }, { onSuccess: () => setOpen(false) })
    } else {
      createEntry.mutate(payload, { onSuccess: () => setOpen(false) })
    }
  }

  if (isLoading) return (
    <div className="p-8 space-y-4 max-w-2xl">
      {Array.from({ length: 3 }).map((_, i) => <CardShimmer key={i} />)}
    </div>
  )
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t('journal.title')}</h1>
          <p className="text-sm text-on-surface-variant mt-1">{t('journal.subtitle')}</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <span className="material-symbols-outlined text-sm">edit_note</span> {t('journal.newEntry')}
        </Button>
      </div>

      {!entries?.length ? (
        <Card className="text-center py-14">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 block">menu_book</span>
          <p className="text-sm font-medium text-on-surface">{t('journal.empty')}</p>
          <p className="text-xs text-on-surface-variant mt-1 mb-4">{t('journal.emptyHint')}</p>
          <Button size="sm" onClick={openCreate}>{t('journal.createFirst')}</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const mood = moodMeta(entry.mood)
            const isExpanded = expanded === entry.id
            const preview = entry.content.length > 120 ? entry.content.slice(0, 120) + '...' : entry.content
            return (
              <Card key={entry.id} className="group cursor-pointer" onClick={() => setExpanded(isExpanded ? null : entry.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {entry.mood && (
                      <span className={`text-xl flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${mood.color}`}>
                        {mood.emoji}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{entry.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{timeAgo(entry.created_at)}</p>
                      <p className="text-sm text-on-surface-variant mt-2 leading-relaxed whitespace-pre-wrap">
                        {isExpanded ? entry.content : preview}
                      </p>
                      {entry.content.length > 120 && (
                        <p className="text-xs text-primary mt-1">{isExpanded ? t('journal.showLess') : t('journal.showMore')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(entry)} className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button onClick={() => deleteEntry.mutate(entry.id)} className="p-1.5 rounded text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('journal.editTitle') : t('journal.newTitle')}>
        <div className="space-y-4">
          <Input label={t('journal.titleLabel')} value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder={t('journal.titlePlaceholder')} />

          <div>
            <p className="text-xs font-medium text-on-surface-variant mb-2">{t('journal.howDoYouFeel')}</p>
            <div className="flex gap-2">
              {MOOD_META.map(m => (
                <button key={m.value}
                  onClick={() => setForm(p => ({ ...p, mood: p.mood === m.value ? null : m.value }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    form.mood === m.value ? `${m.color} border-current` : 'border-outline/20 text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span>{m.emoji}</span> {t(`journal.moods.${m.key}`)}
                </button>
              ))}
            </div>
          </div>

          <Textarea label={t('journal.whatToRecord')} value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder={t('journal.contentPlaceholder')} rows={5} />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" loading={createEntry.isPending || updateEntry.isPending} onClick={handleSubmit}
              disabled={!form.title.trim() || !form.content.trim()}>
              {editing ? t('common.saveChanges') : t('journal.saveEntry')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
