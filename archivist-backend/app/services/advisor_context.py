from datetime import date
from decimal import Decimal
from typing import Dict, Any
from sqlmodel import Session, select, func
from ..models.account import Account
from ..models.income import Income
from ..models.expense import Expense
from ..models.savings import SavingsFund
from ..models.debt import Debt
from ..models.goal import Goal
from ..models.category import Category
from ..models.profile import UserProfile
from ..models.journal import JournalEntry
from ..models.reward import UserReward
from .rewards import REWARD_MAP, compute_metrics, progress_pct


def build_context(session: Session) -> Dict[str, Any]:
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
    savings_total = session.exec(select(func.sum(SavingsFund.amount))).first() or Decimal("0.00")
    debts_total = session.exec(select(func.sum(Debt.remaining_balance))).first() or Decimal("0.00")

    accounts = [
        {"name": a.name, "type": str(a.type), "balance": float(a.balance)}
        for a in session.exec(select(Account)).all()
    ]
    goals = [
        {"name": g.name, "target": float(g.target_amount), "current": float(g.current_amount)}
        for g in session.exec(select(Goal)).all()
    ]

    top_categories = []
    for cat in session.exec(select(Category)).all():
        total = session.exec(
            select(func.sum(Expense.amount)).where(
                Expense.category_id == cat.id,
                func.strftime('%Y', Expense.date) == str(year),
                func.strftime('%m', Expense.date) == f"{month:02d}"
            )
        ).first() or Decimal("0.00")
        if total > 0:
            top_categories.append({"name": cat.name, "amount": float(total)})
    top_categories.sort(key=lambda x: x["amount"], reverse=True)

    profile = session.get(UserProfile, 1)
    recent_entries = session.exec(
        select(JournalEntry).order_by(JournalEntry.created_at.desc()).limit(5)
    ).all()
    journal_entries = [
        {"title": e.title, "mood": e.mood, "content": e.content[:300]}
        for e in recent_entries
    ]

    # Rewards context
    rewards_enabled = profile.rewards_enabled if profile else True
    earned_keys = {r.reward_key for r in session.exec(select(UserReward)).all()}
    metrics = compute_metrics(session)
    earned_rewards = []
    pending_rewards = []
    for key, r in REWARD_MAP.items():
        pct = progress_pct(r, metrics)
        if key in earned_keys:
            earned_rewards.append({"name": r["name"], "tier": r["tier"]})
        else:
            pending_rewards.append({
                "name": r["name"],
                "tier": r["tier"],
                "gift": r["gift"],
                "progress_pct": round(pct, 1),
            })
    # Show only top 5 closest pending (highest progress)
    pending_rewards.sort(key=lambda x: x["progress_pct"], reverse=True)

    return {
        "date": today.isoformat(),
        "total_balance": float(total_balance),
        "monthly_income": float(monthly_income),
        "monthly_expenses": float(monthly_expenses),
        "savings_total": float(savings_total),
        "debts_total": float(debts_total),
        "accounts": accounts,
        "goals": goals,
        "top_expense_categories": top_categories[:5],
        "profile": {
            "display_name": profile.display_name if profile else None,
            "financial_status": profile.financial_status if profile else None,
            "financial_goals_text": profile.financial_goals_text if profile else None,
            "concerns": profile.concerns if profile else None,
            "risk_tolerance": profile.risk_tolerance if profile else "moderate",
            "notes": profile.notes if profile else None,
            "language": profile.language if profile else "es",
        },
        "recent_journal": journal_entries,
        "rewards": {
            "enabled": rewards_enabled,
            "earned": earned_rewards,
            "pending_top5": pending_rewards[:5],
        },
    }


def build_system_prompt(context: Dict[str, Any]) -> str:
    profile = context.get("profile", {})
    journal = context.get("recent_journal", [])

    profile_section = ""
    if any(profile.values()):
        parts = []
        if profile.get("display_name"):
            parts.append(f"User name: {profile['display_name']}")
        if profile.get("financial_status"):
            parts.append(f"Current financial situation: {profile['financial_status']}")
        if profile.get("financial_goals_text"):
            parts.append(f"Financial goals: {profile['financial_goals_text']}")
        if profile.get("concerns"):
            parts.append(f"Main concerns: {profile['concerns']}")
        if profile.get("risk_tolerance"):
            parts.append(f"Risk tolerance: {profile['risk_tolerance']}")
        if profile.get("notes"):
            parts.append(f"Additional context: {profile['notes']}")
        profile_section = "\n\nUser profile:\n" + "\n".join(f"- {p}" for p in parts)

    journal_section = ""
    if journal:
        entries = "\n".join(
            f"  [{e.get('mood', 'neutral')}] {e['title']}: {e['content']}"
            for e in journal
        )
        journal_section = f"\n\nRecent journal entries (for context on the user's state of mind):\n{entries}"

    rewards_data = context.get("rewards", {})
    rewards_section = ""
    if rewards_data.get("enabled"):
        earned = rewards_data.get("earned", [])
        pending = rewards_data.get("pending_top5", [])
        earned_str = ", ".join(f"{r['name']} ({r['tier']})" for r in earned) if earned else "none yet"
        pending_lines = "\n".join(
            f"  - {r['name']} ({r['tier']}): {r['progress_pct']}% — gift: {r['gift']}"
            for r in pending
        )
        rewards_section = (
            f"\n\nRewards & milestones (use these to motivate the user):\n"
            f"- Earned so far: {earned_str}\n"
            f"- Closest rewards to unlock:\n{pending_lines}\n"
            "- Always mention upcoming rewards when relevant to encourage the user."
        )

    lang = profile.get("language", "es")
    lang_instruction = (
        "IMPORTANT: You MUST respond entirely in English, regardless of what language the context data is written in."
        if lang == "en"
        else "IMPORTANTE: Debes responder siempre en español, sin importar el idioma de los datos de contexto."
    )

    return f"""You are a supportive household financial advisor for The Archivist app.
{lang_instruction}
Today's date: {context['date']}{profile_section}

Current financial snapshot:
- Total balance: ${context['total_balance']:,.2f}
- This month's income: ${context['monthly_income']:,.2f}
- This month's expenses: ${context['monthly_expenses']:,.2f}
- Total savings: ${context['savings_total']:,.2f}
- Total debt remaining: ${context['debts_total']:,.2f}
- Accounts: {context['accounts']}
- Goals: {context['goals']}
- Top expense categories this month: {context['top_expense_categories']}{journal_section}{rewards_section}

Guidelines:
- Address the user by name if available
- Tailor advice to their stated goals, concerns, and risk tolerance
- Be specific, actionable, and concise
- Never fabricate numbers not in the provided data
- Focus on practical household budgeting advice
- Be encouraging but realistic
- Acknowledge emotional context from journal entries when relevant
- Keep responses under 300 words unless a detailed plan is explicitly requested
"""
