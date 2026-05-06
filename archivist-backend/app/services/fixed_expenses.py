from datetime import date, timedelta
from calendar import monthrange
from typing import Optional


def compute_next_due_date(payment_day: int, frequency: str, last_paid: Optional[date], today: Optional[date] = None) -> date:
    if today is None:
        today = date.today()

    if frequency == "monthly":
        def safe_date(y, m, d):
            last_day = monthrange(y, m)[1]
            return date(y, m, min(d, last_day))

        candidate = safe_date(today.year, today.month, payment_day)

        if last_paid and last_paid.year == today.year and last_paid.month == today.month:
            nm = today.month + 1
            ny = today.year
            if nm > 12:
                nm = 1
                ny += 1
            candidate = safe_date(ny, nm, payment_day)
        elif candidate < today:
            nm = today.month + 1
            ny = today.year
            if nm > 12:
                nm = 1
                ny += 1
            candidate = safe_date(ny, nm, payment_day)

        return candidate

    elif frequency == "weekly":
        if last_paid:
            return last_paid + timedelta(weeks=1)
        return today

    elif frequency == "yearly":
        try:
            candidate = date(today.year, today.month, payment_day)
        except ValueError:
            candidate = date(today.year, today.month, monthrange(today.year, today.month)[1])
        if candidate < today:
            candidate = date(today.year + 1, today.month, payment_day)
        return candidate

    return today
