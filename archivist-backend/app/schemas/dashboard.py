from typing import List, Optional
from datetime import date
from decimal import Decimal
from pydantic import BaseModel


class RecentTransaction(BaseModel):
    id: int
    kind: str
    date: date
    description: str
    amount: float
    account_id: int
    category_id: Optional[int] = None


class UpcomingPayment(BaseModel):
    id: int
    name: str
    amount: float
    next_due_date: date
    days_until_due: int
    account_id: Optional[int]


class DashboardSummary(BaseModel):
    total_balance: float
    monthly_income: float
    monthly_expenses: float
    monthly_net: float
    savings_total: float
    debts_total: float
    recent_transactions: List[RecentTransaction]
    upcoming_payments: List[UpcomingPayment]
    overdue_payments: List[UpcomingPayment]
