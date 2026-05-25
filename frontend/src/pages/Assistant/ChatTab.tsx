import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { streamAdvisor, analyzeReceiptBase64, createExpense, type AdvisorMode } from '@/services/api'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useQueryClient } from '@tanstack/react-query'
import { useChatMessages, useCreateConversation, useAddChatMessage } from '@/hooks/useChat'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/primitives/Input'
import { Select } from '@/components/primitives/Select'
import { cn } from '@/lib/utils'
import { useCheckRewards } from '@/hooks/useCheckRewards'
import { useUiStore } from '@/store/ui'

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000
const RL_KEY = 'advisor_rl'

interface RLState { count: number; windowStart: number }

function getRLState(): RLState {
  try {
    const raw = localStorage.getItem(RL_KEY)
    if (!raw) return { count: 0, windowStart: Date.now() }
    const s: RLState = JSON.parse(raw)
    if (Date.now() - s.windowStart >= RATE_WINDOW_MS) return { count: 0, windowStart: Date.now() }
    return s
  } catch { return { count: 0, windowStart: Date.now() } }
}

function useAdvisorRateLimit() {
  const [state, setState] = useState<RLState>(getRLState)

  const increment = useCallback(() => {
    setState(prev => {
      const now = Date.now()
      const base = now - prev.windowStart >= RATE_WINDOW_MS ? { count: 0, windowStart: now } : prev
      const next = { count: base.count + 1, windowStart: base.windowStart }
      localStorage.setItem(RL_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const renewsAt = new Date(state.windowStart + RATE_WINDOW_MS)
  const renewsAtStr = renewsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return { count: state.count, limit: RATE_LIMIT, increment, renewsAt: renewsAtStr, exhausted: state.count >= RATE_LIMIT }
}

type MessageKind = 'text' | 'analyzing' | 'expense-card' | 'expense-saved' | 'expense-error' | 'image'

interface Message {
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
  kind?: MessageKind
}

interface ExpenseForm {
  amount: string; date: string; description: string
  category_id: string; account_id: string; expense_type: string
}

async function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve({ base64: result.split(',')[1], mediaType: file.type || 'image/jpeg' })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function ExpenseConfirmCard({ form, saving, categories, accounts, onFormChange, onConfirm, onDiscard, t }: {
  form: ExpenseForm; saving: boolean
  categories: { id: number; name: string }[]; accounts: { id: number; name: string }[]
  onFormChange: (f: ExpenseForm) => void; onConfirm: () => void; onDiscard: () => void
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const f = (key: keyof ExpenseForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onFormChange({ ...form, [key]: e.target.value })
  return (
    <div className="rounded-2xl bg-surface-container border border-outline-variant/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-tertiary/10 border-b border-outline-variant/20">
        <span className="material-symbols-outlined text-base text-tertiary">receipt_long</span>
        <span className="text-sm font-semibold text-on-surface">{t('assistant.chat.receiptDetected')}</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('common.amount')} type="number" min="0" step="0.01" value={form.amount} onChange={f('amount')} />
          <Input label={t('common.date')} type="date" value={form.date} onChange={f('date')} />
        </div>
        <Input label={t('common.description')} value={form.description} onChange={f('description')} />
        <div className="grid grid-cols-2 gap-3">
          <Select label={t('common.category')} value={form.category_id} onChange={f('category_id')}
            placeholder={t('common.selectCategory')} options={categories.map(c => ({ value: String(c.id), label: c.name }))} />
          <Select label={t('common.account')} value={form.account_id} onChange={f('account_id')}
            placeholder={t('common.selectAccount')} options={accounts.map(a => ({ value: String(a.id), label: a.name }))} />
        </div>
        <Select label={t('common.type')} value={form.expense_type} onChange={f('expense_type')}
          options={[{ value: 'variable', label: t('common.variable') }, { value: 'fixed', label: t('common.fixed') }]} />
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onDiscard} disabled={saving}>
            {t('assistant.chat.receiptDiscard')}
          </Button>
          <Button size="sm" className="flex-1" loading={saving}
            disabled={!form.amount || !form.date || !form.account_id} onClick={onConfirm}>
            <span className="material-symbols-outlined text-sm">add</span>
            {t('assistant.chat.receiptConfirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ChatTabProps {
  conversationId: number | null
  onConversationCreated: (id: number) => void
  onNewChat: () => void
}

export function ChatTab({ conversationId, onConversationCreated, onNewChat: _onNewChat }: ChatTabProps) {
  const { t } = useTranslation()
  const checkRewards = useCheckRewards()
  const { showToast } = useUiStore()
  const qc = useQueryClient()
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()

  const createConversation = useCreateConversation()
  const addChatMessage = useAddChatMessage()
  const { data: savedMessages } = useChatMessages(conversationId)

  const rl = useAdvisorRateLimit()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [mode, setMode] = useState<AdvisorMode>('moderate')
  const [pendingImage, setPendingImage] = useState<{ file: File; url: string; base64: string; mediaType: string } | null>(null)
  const [expenseForm, setExpenseForm] = useState<ExpenseForm | null>(null)
  const [savingExpense, setSavingExpense] = useState(false)
  const [activeConvId, setActiveConvId] = useState<number | null>(conversationId)

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync when parent switches conversation
  useEffect(() => {
    setActiveConvId(conversationId)
    setMessages([])
    setExpenseForm(null)
    setInput('')
  }, [conversationId])

  // Load saved messages when conversation selected
  useEffect(() => {
    if (!savedMessages) return
    setMessages(savedMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      kind: m.kind as MessageKind,
    })))
  }, [savedMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Ensure we have a conversation, create one lazily on first message
  const ensureConversation = async (firstUserText: string): Promise<number> => {
    if (activeConvId) return activeConvId
    const title = firstUserText.slice(0, 60) || t('assistant.history.newChat')
    const conv = await createConversation.mutateAsync(title)
    setActiveConvId(conv.id)
    onConversationCreated(conv.id)
    return conv.id
  }

  const persist = (convId: number, role: string, content: string, kind = 'text') => {
    addChatMessage.mutate({ conv_id: convId, data: { role, content, kind } })
  }

  const MODES = [
    { id: 'strict' as AdvisorMode, label: t('assistant.chat.modes.strict'), sublabel: t('assistant.chat.modes.strictDesc'), icon: 'gavel', color: 'text-error border-error/30 bg-error/5' },
    { id: 'moderate' as AdvisorMode, label: t('assistant.chat.modes.moderate'), sublabel: t('assistant.chat.modes.moderateDesc'), icon: 'balance', color: 'text-tertiary border-tertiary/30 bg-tertiary/5' },
    { id: 'second_opinion' as AdvisorMode, label: t('assistant.chat.modes.secondOpinion'), sublabel: t('assistant.chat.modes.secondOpinionDesc'), icon: 'forum', color: 'text-success border-success/30 bg-success/5' },
  ]

  const generalPrompts = t('assistant.chat.generalPrompts', { returnObjects: true }) as string[]
  const purchasePrompts = t('assistant.chat.purchasePrompts', { returnObjects: true }) as string[]

  const handleImageSelect = async (file: File) => {
    const url = URL.createObjectURL(file)
    const { base64, mediaType } = await fileToBase64(file)
    setPendingImage({ file, url, base64, mediaType })
    textareaRef.current?.focus()
  }

  const clearImage = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.url)
    setPendingImage(null)
  }

  const sendReceipt = async () => {
    if (!pendingImage) return
    const imageUrl = pendingImage.url
    const { base64, mediaType } = pendingImage
    clearImage()

    const convId = await ensureConversation(t('assistant.history.receiptTitle'))
    persist(convId, 'user', t('assistant.history.receiptSent'), 'image')

    setMessages(prev => [
      ...prev,
      { role: 'user', content: '', imageUrl, kind: 'image' },
      { role: 'assistant', content: t('assistant.chat.receiptAnalyzing'), kind: 'analyzing' },
    ])

    try {
      const extracted = await analyzeReceiptBase64(base64, mediaType)
      if (!extracted.amount && !extracted.merchant && !extracted.date) {
        const msg = t('assistant.chat.receiptNoData')
        setMessages(prev => { const n = [...prev]; n[n.length - 1] = { role: 'assistant', content: msg, kind: 'text' }; return n })
        persist(convId, 'assistant', msg)
        return
      }
      const form: ExpenseForm = {
        amount: extracted.amount != null ? String(extracted.amount) : '',
        date: extracted.date ?? new Date().toISOString().slice(0, 10),
        description: extracted.merchant ?? '',
        category_id: extracted.category_id != null ? String(extracted.category_id) : '',
        account_id: accounts[0] ? String(accounts[0].id) : '',
        expense_type: 'variable',
      }
      setExpenseForm(form)
      setMessages(prev => { const n = [...prev]; n[n.length - 1] = { role: 'assistant', content: '', kind: 'expense-card' }; return n })
    } catch {
      const msg = t('assistant.chat.receiptError')
      setMessages(prev => { const n = [...prev]; n[n.length - 1] = { role: 'assistant', content: msg, kind: 'text' }; return n })
      persist(convId, 'assistant', msg)
    }
  }

  const confirmExpense = async () => {
    if (!expenseForm || !activeConvId) return
    setSavingExpense(true)
    try {
      await createExpense({
        amount: Number(expenseForm.amount), date: expenseForm.date,
        description: expenseForm.description, account_id: Number(expenseForm.account_id),
        category_id: expenseForm.category_id ? Number(expenseForm.category_id) : null,
        expense_type: expenseForm.expense_type as 'fixed' | 'variable',
      })
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
      setExpenseForm(null)
      const msg = t('assistant.chat.receiptSaved')
      setMessages(prev => { const n = [...prev]; n[n.length - 1] = { role: 'assistant', content: msg, kind: 'expense-saved' }; return n })
      persist(activeConvId, 'assistant', msg, 'expense-saved')
      showToast(msg)
    } catch {
      showToast(t('assistant.chat.receiptError'), 'error')
    } finally {
      setSavingExpense(false)
    }
  }

  const discardExpense = () => {
    setExpenseForm(null)
    setMessages(prev => prev.filter(m => m.kind !== 'expense-card'))
  }

  const sendToAdvisor = async (text: string) => {
    const msg = text.trim()
    if (!msg || streaming || rl.exhausted) return
    rl.increment()
    setInput('')

    const convId = await ensureConversation(msg)
    persist(convId, 'user', msg)

    const history = messages
      .filter(m => m.kind === undefined || m.kind === 'text')
      .map(m => ({ role: m.role, content: m.content }))

    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '', kind: 'text' }])

    let assistantContent = ''
    try {
      for await (const chunk of streamAdvisor({ message: msg, mode, history })) {
        assistantContent += chunk
        setMessages(prev => {
          const n = [...prev]
          n[n.length - 1] = { role: 'assistant', content: assistantContent, kind: 'text' }
          return n
        })
      }
      persist(convId, 'assistant', assistantContent)
    } catch {
      const errMsg = t('assistant.chat.connectionError')
      setMessages(prev => { const n = [...prev]; n[n.length - 1] = { role: 'assistant', content: errMsg, kind: 'text' }; return n })
      persist(convId, 'assistant', errMsg)
    } finally {
      setStreaming(false)
      checkRewards()
    }
  }

  const handleSend = () => pendingImage ? sendReceipt() : sendToAdvisor(input)
  const activeMode = MODES.find(m => m.id === mode)!

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Mode selector */}
      <div className="flex gap-2 mb-4">
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all',
              mode === m.id ? m.color + ' shadow-sm' : 'border-outline/20 text-on-surface-variant hover:bg-surface-container'
            )}>
            <span className="material-symbols-outlined text-base">{m.icon}</span>
            <span>{m.label}</span>
            <span className={cn('text-[10px] font-normal', mode === m.id ? 'opacity-70' : 'text-outline')}>{m.sublabel}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-tertiary/10 flex items-center justify-center mx-auto mb-3">
                <span className={cn('material-symbols-outlined text-2xl', activeMode.color.split(' ')[0])}>{activeMode.icon}</span>
              </div>
              <h3 className="font-semibold text-on-surface">{t('assistant.chat.advisorLabel', { mode: activeMode.label })}</h3>
              <p className="text-sm text-on-surface-variant mt-1">{activeMode.sublabel}</p>
            </div>
            <div className="w-full max-w-md space-y-3">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider text-center">{t('assistant.chat.suggestions.general')}</p>
              <div className="grid grid-cols-2 gap-2">
                {generalPrompts.map(p => (
                  <button key={p} onClick={() => sendToAdvisor(p)}
                    className="text-left px-4 py-3 rounded-xl bg-surface-container text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">
                    {p}
                  </button>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider text-center pt-1">{t('assistant.chat.suggestions.purchase')}</p>
              <div className="grid grid-cols-2 gap-2">
                {purchasePrompts.map(p => (
                  <button key={p} onClick={() => sendToAdvisor(p)}
                    className="text-left px-4 py-3 rounded-xl bg-surface-container text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 justify-center mt-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                {t('assistant.chat.receiptHint')}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            if (m.kind === 'analyzing') return (
              <div key={i} className="flex justify-start">
                <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 bg-surface-container text-on-surface text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-on-surface-variant animate-pulse">receipt_long</span>
                  <span className="text-on-surface-variant">{m.content}</span>
                </div>
              </div>
            )
            if (m.kind === 'expense-card' && expenseForm) return (
              <div key={i} className="flex justify-start">
                <div className="w-full max-w-md">
                  <ExpenseConfirmCard form={expenseForm} saving={savingExpense} categories={categories} accounts={accounts}
                    onFormChange={setExpenseForm} onConfirm={confirmExpense} onDiscard={discardExpense} t={t} />
                </div>
              </div>
            )
            if (m.kind === 'expense-saved') return (
              <div key={i} className="flex justify-start">
                <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 bg-surface-container text-sm flex items-center gap-2 text-success">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>{m.content}</span>
                </div>
              </div>
            )
            return (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[78%] rounded-2xl px-4 py-3 text-sm space-y-2',
                  m.role === 'user' ? 'bg-on-surface text-surface-container-lowest rounded-br-sm' : 'bg-surface-container text-on-surface rounded-bl-sm'
                )}>
                  {m.imageUrl && <img src={m.imageUrl} alt={t('assistant.chat.imageAttached')} className="rounded-xl max-h-48 w-full object-cover mb-1" />}
                  {m.kind === 'image' && !m.imageUrl && (
                    <span className="flex items-center gap-1 text-on-surface-variant/70 italic">
                      <span className="material-symbols-outlined text-sm">receipt_long</span>
                      {t('assistant.history.receiptSent')}
                    </span>
                  )}
                  {m.content ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  ) : (streaming && i === messages.length - 1 ? (
                    <span className="inline-flex gap-1 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  ) : null)}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pending receipt preview */}
      {pendingImage && (
        <div className="relative mb-2 w-fit">
          <img src={pendingImage.url} alt="receipt preview" className="h-20 rounded-xl object-cover border border-outline/20" />
          <button onClick={clearImage} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-on-surface text-surface-container-lowest flex items-center justify-center">
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
          <div className="absolute bottom-1 left-1 right-1 text-center">
            <span className="text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-full">{t('assistant.chat.attachReceipt')}</span>
          </div>
        </div>
      )}

      {/* Rate limit indicator */}
      <div className="flex items-center gap-2 mb-1.5 px-1">
        <span className={cn('text-[11px] tabular-nums', rl.exhausted ? 'text-error' : 'text-on-surface-variant/50')}>
          {rl.count}/{rl.limit}
        </span>
        {rl.count >= rl.limit - 1 && (
          <span className="text-[11px] text-on-surface-variant/50">
            · {t('assistant.chat.renewsAt', { time: rl.renewsAt })}
          </span>
        )}
      </div>

      {/* Input row */}
      <div className="flex gap-2 items-end">
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const file = e.target.files?.[0]; if (file) handleImageSelect(file); e.target.value = '' }} />
        <button onClick={() => fileRef.current?.click()} disabled={streaming} title={t('assistant.chat.attachReceipt')}
          className={cn('flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-colors disabled:opacity-40',
            pendingImage ? 'border-tertiary/40 bg-tertiary/10 text-tertiary' : 'border-outline/20 text-on-surface-variant hover:bg-surface-container')}>
          <span className="material-symbols-outlined text-lg">receipt_long</span>
        </button>
        <textarea ref={textareaRef} value={input} rows={1}
          onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={rl.exhausted ? t('assistant.chat.limitReached', { time: rl.renewsAt }) : (pendingImage ? t('assistant.chat.receiptHint') : t('assistant.chat.generalPlaceholder'))}
          disabled={streaming || !!pendingImage || rl.exhausted}
          className="flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-tertiary disabled:opacity-60 resize-none leading-relaxed"
          style={{ minHeight: '42px' }} />
        <Button loading={streaming} onClick={handleSend} disabled={(!input.trim() && !pendingImage) || rl.exhausted} className="flex-shrink-0 h-10">
          <span className="material-symbols-outlined">{pendingImage ? 'document_scanner' : 'send'}</span>
        </Button>
      </div>
    </div>
  )
}
