import axios from 'axios'
import type {
  Account, Category, Income, Expense, FixedExpense, UpcomingFixedExpense,
  Transfer, Goal, SavingsFund, SavingsContribution, Debt, DebtPayment,
  IncomeDistribution, CsvImport, ReceiptScan, DashboardSummary,
  UserProfile, JournalEntry, RewardsResponse, ChatConversation, ChatMessage
} from '@/types'
import { supabase } from '@/lib/supabase'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    const msg = err.response?.data?.detail || err.message || 'Request failed'
    const message = Array.isArray(msg) ? msg.map((e: any) => e.msg).join(', ') : msg

    if (status === 401) {
      supabase.auth.signOut()
      window.location.href = '/'
    }

    const error = new Error(message) as Error & { status?: number; isProRequired?: boolean }
    error.status = status
    error.isProRequired = status === 402
    return Promise.reject(error)
  }
)

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const getDashboardSummary = () =>
  api.get<DashboardSummary>('/dashboard/summary').then(r => r.data)

// ─── Accounts ────────────────────────────────────────────────────────────────
export const listAccounts = () => api.get<Account[]>('/accounts').then(r => r.data)
export const createAccount = (data: Omit<Account, 'id' | 'balance' | 'created_at'>) =>
  api.post<Account>('/accounts', data).then(r => r.data)
export const updateAccount = (id: number, data: Partial<Account>) =>
  api.put<Account>(`/accounts/${id}`, data).then(r => r.data)
export const deleteAccount = (id: number) => api.delete(`/accounts/${id}`)

// ─── Categories ──────────────────────────────────────────────────────────────
export const listCategories = () => api.get<Category[]>('/categories').then(r => r.data)
export const createCategory = (data: Omit<Category, 'id'>) =>
  api.post<Category>('/categories', data).then(r => r.data)
export const deleteCategory = (id: number) => api.delete(`/categories/${id}`)

// ─── Incomes ──────────────────────────────────────────────────────────────────
export const listIncomes = (params?: { account_id?: number; start_date?: string; end_date?: string }) =>
  api.get<Income[]>('/incomes', { params }).then(r => r.data)
export const createIncome = (data: Omit<Income, 'id' | 'created_at'>) =>
  api.post<Income>('/incomes', data).then(r => r.data)
export const updateIncome = (id: number, data: Partial<Income>) =>
  api.put<Income>(`/incomes/${id}`, data).then(r => r.data)
export const deleteIncome = (id: number) => api.delete(`/incomes/${id}`)

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const listExpenses = (params?: {
  account_id?: number; category_id?: number; expense_type?: string;
  start_date?: string; end_date?: string
}) => api.get<Expense[]>('/expenses', { params }).then(r => r.data)
export const createExpense = (data: Omit<Expense, 'id' | 'created_at'>) =>
  api.post<Expense>('/expenses', data).then(r => r.data)
export const updateExpense = (id: number, data: Partial<Expense>) =>
  api.put<Expense>(`/expenses/${id}`, data).then(r => r.data)
export const deleteExpense = (id: number) => api.delete(`/expenses/${id}`)

// ─── Fixed Expenses ───────────────────────────────────────────────────────────
export const listFixedExpenses = () => api.get<FixedExpense[]>('/fixed-expenses').then(r => r.data)
export const getUpcomingFixedExpenses = (days = 7) =>
  api.get<{ upcoming: UpcomingFixedExpense[]; overdue: UpcomingFixedExpense[] }>('/fixed-expenses/upcoming', { params: { days } }).then(r => r.data)
export const createFixedExpense = (data: Omit<FixedExpense, 'id' | 'created_at'>) =>
  api.post<FixedExpense>('/fixed-expenses', data).then(r => r.data)
export const updateFixedExpense = (id: number, data: Partial<FixedExpense>) =>
  api.put<FixedExpense>(`/fixed-expenses/${id}`, data).then(r => r.data)
export const deleteFixedExpense = (id: number) => api.delete(`/fixed-expenses/${id}`)

// ─── Transfers ────────────────────────────────────────────────────────────────
export const listTransfers = (params?: { account_id?: number }) =>
  api.get<Transfer[]>('/transfers', { params }).then(r => r.data)
export const createTransfer = (data: Omit<Transfer, 'id' | 'created_at'>) =>
  api.post<Transfer>('/transfers', data).then(r => r.data)
export const deleteTransfer = (id: number) => api.delete(`/transfers/${id}`)

// ─── Goals ───────────────────────────────────────────────────────────────────
export const listGoals = () => api.get<Goal[]>('/goals').then(r => r.data)
export const createGoal = (data: Omit<Goal, 'id' | 'created_at' | 'current_amount'>) =>
  api.post<Goal>('/goals', data).then(r => r.data)
export const updateGoal = (id: number, data: Partial<Goal>) =>
  api.put<Goal>(`/goals/${id}`, data).then(r => r.data)
export const deleteGoal = (id: number) => api.delete(`/goals/${id}`)
export const listGoalContributions = (goal_id: number) =>
  api.get<import('@/types').GoalContribution[]>(`/goals/${goal_id}/contributions`).then(r => r.data)
export const createGoalContribution = (goal_id: number, data: { amount: number; date: string; note?: string }) =>
  api.post<import('@/types').GoalContribution>(`/goals/${goal_id}/contributions`, data).then(r => r.data)
export const deleteGoalContribution = (goal_id: number, contribution_id: number) =>
  api.delete(`/goals/${goal_id}/contributions/${contribution_id}`)

// ─── Savings ──────────────────────────────────────────────────────────────────
export const listSavingsFunds = () => api.get<SavingsFund[]>('/savings/funds').then(r => r.data)
export const createSavingsFund = (data: { name: string; goal_id?: number | null }) =>
  api.post<SavingsFund>('/savings/funds', data).then(r => r.data)
export const updateSavingsFund = (id: number, data: Partial<SavingsFund>) =>
  api.put<SavingsFund>(`/savings/funds/${id}`, data).then(r => r.data)
export const deleteSavingsFund = (id: number) => api.delete(`/savings/funds/${id}`)
export const listContributions = (fund_id?: number) =>
  api.get<SavingsContribution[]>('/savings/contributions', { params: fund_id ? { fund_id } : {} }).then(r => r.data)
export const createContribution = (data: Omit<SavingsContribution, 'id'>) =>
  api.post<SavingsContribution>('/savings/contributions', data).then(r => r.data)
export const deleteContribution = (id: number) => api.delete(`/savings/contributions/${id}`)

// ─── Debts ────────────────────────────────────────────────────────────────────
export const listDebts = () => api.get<Debt[]>('/debts').then(r => r.data)
export const createDebt = (data: Omit<Debt, 'id' | 'created_at'>) =>
  api.post<Debt>('/debts', data).then(r => r.data)
export const updateDebt = (id: number, data: Partial<Debt>) =>
  api.put<Debt>(`/debts/${id}`, data).then(r => r.data)
export const deleteDebt = (id: number) => api.delete(`/debts/${id}`)
export const listDebtPayments = (debt_id: number) =>
  api.get<DebtPayment[]>(`/debts/${debt_id}/payments`).then(r => r.data)
export const createDebtPayment = (debt_id: number, data: Omit<DebtPayment, 'id' | 'debt_id'>) =>
  api.post<DebtPayment>(`/debts/${debt_id}/payments`, data).then(r => r.data)
export const deleteDebtPayment = (debt_id: number, payment_id: number) =>
  api.delete(`/debts/${debt_id}/payments/${payment_id}`)

// ─── Distribution ─────────────────────────────────────────────────────────────
export const getDistribution = () => api.get<IncomeDistribution[]>('/distribution').then(r => r.data)
export const updateDistribution = (items: { category: string; percentage: number }[]) =>
  api.put<IncomeDistribution[]>('/distribution', { items }).then(r => r.data)

// ─── CSV Import ───────────────────────────────────────────────────────────────
export const listCsvImports = () => api.get<CsvImport[]>('/csv/imports').then(r => r.data)
export const uploadCsv = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/csv/upload', form).then(r => r.data)
}
export const mapCsvColumns = (id: number, target: string, mapping: Record<string, string>) =>
  api.post(`/csv/${id}/map-columns`, { target, mapping }).then(r => r.data)
export const importCsv = (id: number) =>
  api.post(`/csv/${id}/import`).then(r => r.data)

// ─── Receipt Scan ─────────────────────────────────────────────────────────────
export const scanReceipt = (file: File) => {
  const form = new FormData()
  form.append('image', file)
  return api.post<ReceiptScan>('/receipt/scan', form).then(r => r.data)
}
export const uploadReceipt = scanReceipt
export const listReceiptScans = () => api.get<ReceiptScan[]>('/receipt/scans').then(r => r.data)
export const updateReceiptScan = (id: number, data: Partial<ReceiptScan>) =>
  api.put<ReceiptScan>(`/receipt/scans/${id}`, data).then(r => r.data)
export const saveReceiptScan = (id: number, data: { account_id: number; description?: string; expense_type?: string }) =>
  api.post<ReceiptScan>(`/receipt/scans/${id}/save`, data).then(r => r.data)
export const deleteReceiptScan = (id: number) => api.delete(`/receipt/scans/${id}`)

export const analyzeReceiptBase64 = (image_base64: string, image_media_type: string) =>
  api.post<{
    merchant: string | null; amount: number | null; date: string | null
    category_id: number | null; raw_text: string | null
  }>('/receipt/analyze', { image_base64, image_media_type }).then(r => r.data)

// ─── Profile ─────────────────────────────────────────────────────────────────
export const getProfile = () => api.get<UserProfile>('/profile').then(r => r.data)
export const updateProfile = (data: Partial<Omit<UserProfile, 'id' | 'updated_at'>>) =>
  api.put<UserProfile>('/profile', data).then(r => r.data)

// ─── Journal ──────────────────────────────────────────────────────────────────
export const listJournalEntries = () => api.get<JournalEntry[]>('/journal').then(r => r.data)
export const createJournalEntry = (data: { title: string; content: string; mood?: string | null }) =>
  api.post<JournalEntry>('/journal', data).then(r => r.data)
export const updateJournalEntry = (id: number, data: Partial<{ title: string; content: string; mood: string | null }>) =>
  api.put<JournalEntry>(`/journal/${id}`, data).then(r => r.data)
export const deleteJournalEntry = (id: number) => api.delete(`/journal/${id}`)

// ─── Rewards ─────────────────────────────────────────────────────────────────
export const getRewards = () => api.get<RewardsResponse>('/rewards').then(r => r.data)
export const checkRewards = () => api.post<{ newly_earned: string[] }>('/rewards/check').then(r => r.data)
export const markRewardsSeen = () => api.put('/rewards/seen').then(r => r.data)
export const updateRewardSettings = (enabled: boolean) =>
  api.put('/rewards/settings', { rewards_enabled: enabled }).then(r => r.data)

// ─── Chat history ─────────────────────────────────────────────────────────────
export const listConversations = () => api.get<ChatConversation[]>('/chat/conversations').then(r => r.data)
export const createConversation = (title: string) => api.post<ChatConversation>('/chat/conversations', { title }).then(r => r.data)
export const deleteConversation = (id: number) => api.delete(`/chat/conversations/${id}`)
export const listChatMessages = (conv_id: number) => api.get<ChatMessage[]>(`/chat/conversations/${conv_id}/messages`).then(r => r.data)
export const addChatMessage = (conv_id: number, data: { role: string; content: string; kind?: string }) =>
  api.post<ChatMessage>(`/chat/conversations/${conv_id}/messages`, data).then(r => r.data)

// ─── Billing ──────────────────────────────────────────────────────────────────
export const createCheckout = () =>
  api.post<{ checkout_url: string }>('/billing/checkout').then(r => r.data)
export const createPortal = () =>
  api.post<{ portal_url: string }>('/billing/portal').then(r => r.data)

// ─── AI Advisor (SSE async generator) ────────────────────────────────────────
export type AdvisorMode = 'strict' | 'moderate' | 'second_opinion'

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}

export async function* streamAdvisor(opts: {
  message: string
  mode?: AdvisorMode
  imageBase64?: string
  imageMediaType?: string
  history?: { role: 'user' | 'assistant'; content: string }[]
}): AsyncGenerator<string> {
  const authHeader = await getAuthHeader()
  const response = await fetch(`${BASE_URL}/advisor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({
      message: opts.message,
      advisor_mode: opts.mode ?? 'moderate',
      image_base64: opts.imageBase64 ?? null,
      image_media_type: opts.imageMediaType ?? 'image/jpeg',
      history: opts.history ?? [],
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Unknown error' }))
    const error = new Error(err.detail || `HTTP ${response.status}`) as Error & { status?: number; isProRequired?: boolean }
    error.status = response.status
    error.isProRequired = response.status === 402
    throw error
  }
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          if (data.delta) yield data.delta
          if (data.done) return
          if (data.error) throw new Error(data.error)
        } catch { /* skip malformed */ }
      }
    }
  }
}

export async function* streamReportAnalysis(): AsyncGenerator<string> {
  const authHeader = await getAuthHeader()
  const response = await fetch(`${BASE_URL}/advisor/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Unknown error' }))
    const error = new Error(err.detail || `HTTP ${response.status}`) as Error & { status?: number; isProRequired?: boolean }
    error.status = response.status
    error.isProRequired = response.status === 402
    throw error
  }
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          if (data.delta) yield data.delta
          if (data.done) return
          if (data.error) throw new Error(data.error)
        } catch { /* skip malformed */ }
      }
    }
  }
}

export async function getSavedAnalysis(): Promise<{ text: string; created_at: string } | null> {
  const authHeader = await getAuthHeader()
  const res = await fetch(`${BASE_URL}/advisor/report/saved`, { headers: authHeader })
  if (!res.ok) return null
  return res.json()
}

export async function saveAnalysis(text: string): Promise<{ id: number; created_at: string }> {
  const authHeader = await getAuthHeader()
  const res = await fetch(`${BASE_URL}/advisor/report/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('Failed to save analysis')
  return res.json()
}
