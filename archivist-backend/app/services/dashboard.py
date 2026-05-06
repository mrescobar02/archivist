from datetime import date
from decimal import Decimal
from typing import List
from sqlmodel import Session, select, func
from ..models.account import Account
from ..models.income import Income
from ..models.expense import Expense
from ..models.savings import SavingsFund
from ..models.debt import Debt
from ..models.fixed_expense import FixedExpense
from ..schemas.dashboard import DashboardSummary, RecentTransaction, UpcomingPayment
from .fixed_expenses import compute_next_due_date


def get_dashboard_summary(session: Session) -> DashboardSummary:
    today = date.today()
    year, month = today.year, today.month

    total_balance = session.exec(select(func.sum(Account.balance))).first() or Decimal("0.00")
    monthly_income = session.exec(
        select(func.sum(Income.amount)).where(
            func.strftime('%Y', Income.date) == str(year),
            func.strftime('%m', Income.date) == f"{month:02d}"
        )
    ).first() or Decimal("0.00")
    monthly_expenses = session.exec(
        select(func.sum(Expense.amount)).where(
            func.strftime('%Y', Expense.date) == str(year),
            func.strftime('%m', Expense.date) == f"{month:02d}"
        )
    ).first() or Decimal("0.00")

    monthly_net = Decimal(str(monthly_income)) - Decimal(str(monthly_expenses))
    savings_total = session.exec(select(func.sum(SavingsFund.amount))).first() or Decimal("0.00")
    debts_total = session.exec(select(func.sum(Debt.remaining_balance))).first() or Decimal("0.00")

    incomes = session.exec(select(Income).order_by(Income.date.desc()).limit(10)).all()
    expenses = session.exec(select(Expense).order_by(Expense.date.desc()).limit(10)).all()

    transactions: List[RecentTransaction] = []
    for inc in incomes:
        transactions.append(RecentTransaction(
            id=inc.id, kind="income", date=inc.date,
            description=inc.description or inc.source or "Income",
            amount=inc.amount, account_id=inc.account_id,
        ))
    for exp in expenses:
        transactions.append(RecentTransaction(
            id=exp.id, kind="expense", date=exp.date,
            description=exp.description,
            amount=-exp.amount, account_id=exp.account_id,
            category_id=exp.category_id,
        ))
    transactions.sort(key=lambda t: t.date, reverse=True)
    transactions = transactions[:10]

    fixed_expenses = session.exec(select(FixedExpense).where(FixedExpense.is_active == True)).all()
    upcoming: List[UpcomingPayment] = []
    overdue: List[UpcomingPayment] = []

    for fe in fixed_expenses:
        next_due = compute_next_due_date(fe.payment_day, fe.frequency, fe.last_paid, today)
        days_until = (next_due - today).days
        payment = UpcomingPayment(
            id=fe.id, name=fe.name, amount=fe.amount,
            next_due_date=next_due, days_until_due=days_until, account_id=fe.account_id,
        )
        if days_until < 0:
            overdue.append(payment)
        elif days_until <= 7:
            upcoming.append(payment)

    overdue.sort(key=lambda p: p.days_until_due)
    upcoming.sort(key=lambda p: p.days_until_due)

    return DashboardSummary(
        total_balance=Decimal(str(total_balance)),
        monthly_income=Decimal(str(monthly_income)),
        monthly_expenses=Decimal(str(monthly_expenses)),
        monthly_net=monthly_net,
        savings_total=Decimal(str(savings_total)),
        debts_total=Decimal(str(debts_total)),
        recent_transactions=transactions,
        upcoming_payments=upcoming,
        overdue_payments=overdue,
    )
