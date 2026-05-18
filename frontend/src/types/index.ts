export type AccountType = 'checking' | 'savings' | 'cash' | 'investment'
export type ExpenseType = 'fixed' | 'variable'
export type Frequency = 'monthly' | 'weekly' | 'yearly'
export type CsvImportStatus = 'pending' | 'mapped' | 'imported' | 'failed'
export type ReceiptScanStatus = 'pending' | 'reviewed' | 'saved' | 'failed' | 'completed'

export interface Account {
  id: number
  name: string
  type: AccountType
  balance: number
  initial_balance: number
  created_at: string
}

export interface Category {
  id: number
  name: string
  icon: string
  color: string
}

export interface Income {
  id: number
  amount: number
  date: string
  type: string
  description: string
  account_id: number
  source: string
  created_at: string
}

export interface Expense {
  id: number
  amount: number
  date: string
  category_id: number | null
  description: string
  account_id: number
  expense_type: ExpenseType
  created_at: string
}

export interface FixedExpense {
  id: number
  name: string
  amount: number
  category_id: number | null
  payment_day: number
  renewal_date: string | null
  frequency: Frequency
  last_paid: string | null
  account_id: number | null
  is_active: boolean
  created_at: string
}

export interface UpcomingFixedExpense {
  id: number
  name: string
  amount: number
  payment_day: number
  next_due_date: string
  days_until_due: number
  account_id: number | null
}

export interface Transfer {
  id: number
  from_account_id: number
  to_account_id: number
  amount: number
  date: string
  note: string
  created_at: string
}

export interface Goal {
  id: number
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  icon: string
  created_at: string
}

export interface SavingsFund {
  id: number
  name: string
  amount: number
  goal_id: number | null
  created_at: string
}

export interface SavingsContribution {
  id: number
  fund_id: number
  amount: number
  date: string
  note: string
}

export interface GoalContribution {
  id: number
  goal_id: number
  amount: number
  date: string
  note: string
}

export interface Debt {
  id: number
  name: string
  creditor: string
  total_amount: number
  remaining_balance: number
  interest_rate: number
  minimum_payment: number
  cut_date: number | null
  payment_due_day: number | null
  created_at: string
}

export interface DebtPayment {
  id: number
  debt_id: number
  amount: number
  date: string
  note: string
}

export interface IncomeDistribution {
  id: number
  category: string
  percentage: number
}

export interface CsvImport {
  id: number
  filename: string
  status: CsvImportStatus
  total_rows: number
  imported_rows: number
  created_at: string
}

export interface ReceiptScan {
  id: number
  image_path: string
  merchant: string | null
  amount: number | null
  date: string | null
  category_id: number | null
  raw_text: string | null
  status: ReceiptScanStatus
  created_at: string
}

export interface RecentTransaction {
  id: number
  kind: 'income' | 'expense'
  date: string
  description: string
  amount: number
  account_id: number
  category_id?: number | null
}

export interface UpcomingPayment {
  id: number
  name: string
  amount: number
  next_due_date: string
  days_until_due: number
  account_id: number | null
}

export interface DashboardSummary {
  total_balance: number
  monthly_income: number
  monthly_expenses: number
  monthly_net: number
  savings_total: number
  debts_total: number
  recent_transactions: RecentTransaction[]
  upcoming_payments: UpcomingPayment[]
  overdue_payments: UpcomingPayment[]
}

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive'
export type JournalMood = 'stressed' | 'neutral' | 'positive'

export interface UserProfile {
  id: number
  display_name: string | null
  financial_status: string | null
  financial_goals_text: string | null
  concerns: string | null
  risk_tolerance: RiskTolerance
  notes: string | null
  language: 'es' | 'en'
  rewards_enabled: boolean
  updated_at: string
}

export interface JournalEntry {
  id: number
  title: string
  content: string
  mood: JournalMood | null
  created_at: string
  updated_at: string
}

export type RewardTier = 'bronze' | 'silver' | 'gold' | 'diamond'

export interface RewardItem {
  key: string
  name: string
  description: string
  gift: string
  icon: string
  tier: RewardTier
  hidden: boolean
  condition: string
  threshold: number
  earned: boolean
  earned_at: string | null
  is_seen: boolean
  progress_pct: number
}

export interface ChatConversation {
  id: number
  title: string
  created_at: string
}

export interface ChatMessage {
  id: number
  conversation_id: number
  role: 'user' | 'assistant'
  content: string
  kind: string
  created_at: string
}

export type NotificationType = 'info' | 'success' | 'warning'

export interface SystemNotification {
  id: string
  title: string
  body: string
  type: NotificationType
  is_active: boolean
  created_at: string
}

export interface RewardsResponse {
  rewards_enabled: boolean
  metrics: Record<string, number>
  rewards: RewardItem[]
  unseen_count: number
  earned_count: number
  total_count: number
}
