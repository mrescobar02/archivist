from datetime import datetime, date
from typing import Any, Dict, List
from sqlmodel import Session, select, func
from ..models.reward import UserReward
from ..models.profile import UserProfile
from ..models.savings import SavingsFund
from ..models.debt import Debt
from ..models.goal import Goal
from ..models.income import Income
from ..models.expense import Expense
from ..models.journal import JournalEntry

# ──────────────────────────────────────────────────────────────────────────────
# Reward catalog
# ──────────────────────────────────────────────────────────────────────────────

REWARDS: List[Dict[str, Any]] = [
    # Savings total milestones
    dict(key="savings_500",      name="Primer Paso",        tier="bronze", icon="🥗",
         description="Lograste acumular $500 en ahorros.",
         gift="Una cena especial para dos en tu restaurante favorito.",
         condition="savings_total", threshold=500),
    dict(key="savings_2500",     name="Ahorro Sólido",       tier="bronze", icon="💪",
         description="$2,500 ahorrados — ya tienes una base real.",
         gift="Un día de spa o masaje — te lo mereces.",
         condition="savings_total", threshold=2500),
    dict(key="savings_5000",     name="Base Firme",          tier="silver", icon="🏕️",
         description="¡Cinco mil dólares en tu reserva!",
         gift="Un fin de semana de escapada familiar.",
         condition="savings_total", threshold=5000),
    dict(key="savings_10000",    name="Diez de Diez",        tier="silver", icon="🎸",
         description="$10,000 ahorrados — estás construyendo patrimonio.",
         gift="Un concierto o evento cultural especial.",
         condition="savings_total", threshold=10000),
    dict(key="savings_25000",    name="Patrimonio Real",     tier="gold",   icon="🌍",
         description="$25,000 ahorrados. Estás en otro nivel.",
         gift="El viaje internacional que siempre soñaste.",
         condition="savings_total", threshold=25000),

    # Emergency fund
    dict(key="emergency_25",     name="Escudo Inicial",      tier="bronze", icon="🛡️",
         description="Tu fondo de emergencia llegó al 25%.",
         gift="Una noche de cine en casa con comida especial.",
         condition="emergency_pct", threshold=25),
    dict(key="emergency_50",     name="Medio Blindado",      tier="silver", icon="⛺",
         description="Fondo de emergencia al 50% — ya puedes respirar.",
         gift="Una excursión de un día a un lugar cercano.",
         condition="emergency_pct", threshold=50),
    dict(key="emergency_75",     name="Casi Seguro",         tier="silver", icon="🏨",
         description="75% de tu fondo de emergencia completo.",
         gift="Una noche en un hotel boutique local.",
         condition="emergency_pct", threshold=75),
    dict(key="emergency_100",    name="Blindado Total",      tier="gold",   icon="🏆",
         description="¡Fondo de emergencia completo! Eres imparable.",
         gift="Unas vacaciones familiares bien merecidas.",
         condition="emergency_pct", threshold=100),

    # Goals
    dict(key="goal_first",       name="Visionario",          tier="bronze", icon="🎯",
         description="Creaste tu primera meta financiera.",
         gift="Un libro de finanzas personales para seguir aprendiendo.",
         condition="goals_created", threshold=1),
    dict(key="goal_50pct",       name="En Marcha",           tier="bronze", icon="🚀",
         description="Una de tus metas llegó al 50% de progreso.",
         gift="Una tarde libre dedicada a algo que genuinamente disfrutes.",
         condition="any_goal_pct", threshold=50),
    dict(key="goal_complete_1",  name="Meta Cumplida",       tier="gold",   icon="🎉",
         description="¡Completaste tu primera meta financiera!",
         gift="Tú decides: celebra como mereces este logro.",
         condition="goals_completed", threshold=1),
    dict(key="goal_complete_3",  name="Tres de Tres",        tier="gold",   icon="🌟",
         description="Tres metas financieras completadas.",
         gift="Una experiencia premium — tú eliges qué la vale.",
         condition="goals_completed", threshold=3),

    # Debt reduction
    dict(key="debt_10pct",       name="Atacando la Deuda",   tier="bronze", icon="⚔️",
         description="Redujiste tu deuda total en un 10%.",
         gift="Un café especial y una mañana tranquila para celebrar.",
         condition="debt_reduction_pct", threshold=10),
    dict(key="debt_25pct",       name="Rompiendo Cadenas",   tier="silver", icon="🔗",
         description="¡25% menos de deuda total!",
         gift="Una cena familiar en tu restaurante favorito.",
         condition="debt_reduction_pct", threshold=25),
    dict(key="debt_50pct",       name="Mitad Libre",         tier="silver", icon="🦅",
         description="Eliminaste la mitad de tu deuda original.",
         gift="Un fin de semana de aventura familiar.",
         condition="debt_reduction_pct", threshold=50),
    dict(key="debt_free",        name="Totalmente Libre",    tier="gold",   icon="🌈",
         description="¡Eliminaste todas tus deudas! Eres libre.",
         gift="El viaje que siempre quisiste hacer — sin culpa.",
         condition="debt_reduction_pct", threshold=100),

    # Journaling
    dict(key="journal_1",        name="Primer Reflejo",      tier="bronze", icon="📖",
         description="Escribiste tu primera entrada en la bitácora.",
         gift="Un momento de paz y tu bebida favorita.",
         condition="journal_entries", threshold=1),
    dict(key="journal_5",        name="Reflexivo",           tier="bronze", icon="📓",
         description="5 entradas en tu bitácora financiera.",
         gift="Un diario físico bonito para acompañar tu proceso.",
         condition="journal_entries", threshold=5),
    dict(key="journal_10",       name="Constante",           tier="silver", icon="✍️",
         description="10 entradas — la constancia es tu superpoder.",
         gift="Una sesión de coaching o mentoría financiera.",
         condition="journal_entries", threshold=10),

    # Monthly surplus
    dict(key="surplus_1",        name="Mes en Verde",        tier="bronze", icon="📈",
         description="Tu primer mes cerrando con balance positivo.",
         gift="Algo pequeño que hayas querido por un tiempo.",
         condition="positive_months", threshold=1),
    dict(key="surplus_3",        name="Trimestre Ganador",   tier="silver", icon="🎭",
         description="3 meses consecutivos con balance positivo.",
         gift="Una experiencia especial — cine, teatro o concierto.",
         condition="positive_months", threshold=3),
    dict(key="surplus_6",        name="Semestre Imparable",  tier="gold",   icon="🔥",
         description="6 meses en positivo. Eres un ejemplo a seguir.",
         gift="Una inversión en ti mismo: curso, viaje o experiencia.",
         condition="positive_months", threshold=6),

    # ── Hidden / Diamond tier ─────────────────────────────────────────────────
    dict(key="hidden_ask_before_buy", name="Comprador Consciente",  tier="diamond", hidden=True, icon="💎",
         description="Consultaste al asesor antes de tomar una decisión de compra.",
         gift="La claridad mental vale más que cualquier descuento.",
         condition="direct", threshold=1),

    dict(key="hidden_budget_chat",    name="Alumno del Presupuesto", tier="diamond", hidden=True, icon="💎",
         description="Dedicaste tiempo a entender tu presupuesto con el asesor.",
         gift="El conocimiento es el mejor activo financiero.",
         condition="direct", threshold=1),

    dict(key="hidden_night_owl",      name="Búho Financiero",        tier="diamond", hidden=True, icon="💎",
         description="Gestionaste tus finanzas en las horas más tranquilas del día.",
         gift="La disciplina nocturna merece un buen descanso — date una noche de hotel.",
         condition="direct", threshold=1),

    dict(key="hidden_monthly_5",      name="Racha del Mes",          tier="diamond", hidden=True, icon="💎",
         description="Registraste 5 o más movimientos financieros en un solo mes.",
         gift="Tu constancia merece una tarde de relax — spa o masaje.",
         condition="monthly_entries", threshold=5),

    dict(key="hidden_debt_and_goal",  name="Equilibrista",           tier="diamond", hidden=True, icon="💎",
         description="Llevas al mismo tiempo una deuda activa y una meta de ahorro.",
         gift="Dominar dos frentes a la vez merece una cena especial.",
         condition="has_debt_and_goal", threshold=1),

    dict(key="hidden_categories",     name="Maestro del Registro",   tier="diamond", hidden=True, icon="💎",
         description="Usaste 5 o más categorías distintas para clasificar tus gastos.",
         gift="Un libro sobre finanzas personales — sigue aprendiendo.",
         condition="distinct_categories", threshold=5),
]

REWARD_MAP = {r["key"]: r for r in REWARDS}


# ──────────────────────────────────────────────────────────────────────────────
# Metrics computation
# ──────────────────────────────────────────────────────────────────────────────

def compute_metrics(session: Session) -> Dict[str, float]:
    savings_total = float(
        session.exec(select(func.sum(SavingsFund.amount))).first() or 0
    )

    # Emergency fund: find goal containing "emergencia" or "emergency"
    goals = session.exec(select(Goal)).all()
    emergency_pct = 0.0
    any_goal_pct = 0.0
    goals_completed = 0
    for g in goals:
        if g.target_amount > 0:
            pct = float(g.current_amount) / float(g.target_amount) * 100
            any_goal_pct = max(any_goal_pct, pct)
            if pct >= 100:
                goals_completed += 1
            name_lower = g.name.lower()
            if "emergencia" in name_lower or "emergency" in name_lower or "emerg" in name_lower:
                emergency_pct = max(emergency_pct, pct)
    # If no emergency goal found, use best goal
    if emergency_pct == 0 and any_goal_pct > 0:
        emergency_pct = any_goal_pct

    goals_created = len(goals)

    # Debt reduction
    debts = session.exec(select(Debt)).all()
    original_total = sum(float(d.total_amount) for d in debts)
    remaining_total = sum(float(d.remaining_balance) for d in debts)
    debt_reduction_pct = 0.0
    if original_total > 0:
        debt_reduction_pct = (original_total - remaining_total) / original_total * 100

    journal_entries = session.exec(select(func.count(JournalEntry.id))).first() or 0

    # Positive months: count months where income > expenses (last 12 months)
    today = date.today()
    positive_months = 0
    for offset in range(12):
        month = today.month - offset
        year = today.year
        while month <= 0:
            month += 12
            year -= 1
        year_s, month_s = str(year), f"{month:02d}"
        inc = float(session.exec(
            select(func.sum(Income.amount)).where(
                func.strftime('%Y', Income.date) == year_s,
                func.strftime('%m', Income.date) == month_s,
            )
        ).first() or 0)
        exp = float(session.exec(
            select(func.sum(Expense.amount)).where(
                func.strftime('%Y', Expense.date) == year_s,
                func.strftime('%m', Expense.date) == month_s,
            )
        ).first() or 0)
        if inc > 0 and inc > exp:
            positive_months += 1

    # Hidden reward metrics
    today = date.today()
    month_s = f"{today.month:02d}"
    year_s = str(today.year)
    exp_this_month = int(session.exec(
        select(func.count(Expense.id)).where(
            func.strftime('%Y', Expense.date) == year_s,
            func.strftime('%m', Expense.date) == month_s,
        )
    ).first() or 0)
    inc_this_month = int(session.exec(
        select(func.count(Income.id)).where(
            func.strftime('%Y', Income.date) == year_s,
            func.strftime('%m', Income.date) == month_s,
        )
    ).first() or 0)
    journal_this_month = int(session.exec(
        select(func.count(JournalEntry.id)).where(
            func.strftime('%Y', JournalEntry.created_at) == year_s,
            func.strftime('%m', JournalEntry.created_at) == month_s,
        )
    ).first() or 0)
    monthly_entries = float(exp_this_month + inc_this_month + journal_this_month)

    has_debt_and_goal = 1.0 if (len(debts) > 0 and len(goals) > 0) else 0.0

    from ..models.category import Category
    distinct_categories = float(session.exec(
        select(func.count(func.distinct(Expense.category_id))).where(Expense.category_id != None)
    ).first() or 0)

    return {
        "savings_total": savings_total,
        "emergency_pct": min(emergency_pct, 100.0),
        "goals_created": float(goals_created),
        "any_goal_pct": min(any_goal_pct, 100.0),
        "goals_completed": float(goals_completed),
        "debt_reduction_pct": min(debt_reduction_pct, 100.0),
        "journal_entries": float(int(journal_entries)),
        "positive_months": float(positive_months),
        "monthly_entries": monthly_entries,
        "has_debt_and_goal": has_debt_and_goal,
        "distinct_categories": distinct_categories,
    }


def condition_met(reward: Dict, metrics: Dict[str, float]) -> bool:
    if reward.get("condition") == "direct":
        return False  # only awarded via award_hidden_reward()
    return metrics.get(reward["condition"], 0) >= reward["threshold"]


def award_hidden_reward(session: Session, key: str) -> bool:
    """Directly award a hidden reward. Returns True if newly awarded."""
    existing = session.exec(select(UserReward).where(UserReward.reward_key == key)).first()
    if existing:
        return False
    if key not in REWARD_MAP:
        return False
    session.add(UserReward(reward_key=key))
    session.commit()
    return True


def progress_pct(reward: Dict, metrics: Dict[str, float]) -> float:
    value = metrics.get(reward["condition"], 0)
    if reward["threshold"] == 0:
        return 100.0
    return min(100.0, value / reward["threshold"] * 100)


# ──────────────────────────────────────────────────────────────────────────────
# Check & award
# ──────────────────────────────────────────────────────────────────────────────

def check_and_award(session: Session) -> List[str]:
    """Award newly earned rewards. Also surfaces direct-awarded hidden rewards not yet seen."""
    profile = session.get(UserProfile, 1)
    if profile and not profile.rewards_enabled:
        return []

    earned_keys = {r.reward_key for r in session.exec(select(UserReward)).all()}
    metrics = compute_metrics(session)

    newly_awarded = []
    for reward in REWARDS:
        if reward["key"] in earned_keys:
            continue
        if condition_met(reward, metrics):
            session.add(UserReward(reward_key=reward["key"]))
            newly_awarded.append(reward["key"])

    if newly_awarded:
        session.commit()

    # Also surface direct-awarded hidden rewards not yet seen
    unseen_direct = [
        r.reward_key for r in session.exec(
            select(UserReward).where(UserReward.is_seen == False)
        ).all()
        if r.reward_key not in newly_awarded
        and REWARD_MAP.get(r.reward_key, {}).get("condition") == "direct"
    ]

    return newly_awarded + unseen_direct


# ──────────────────────────────────────────────────────────────────────────────
# Build full rewards response
# ──────────────────────────────────────────────────────────────────────────────

def build_rewards_response(session: Session) -> Dict:
    profile = session.get(UserProfile, 1)
    rewards_enabled = profile.rewards_enabled if profile else True

    earned_map = {
        r.reward_key: r
        for r in session.exec(select(UserReward)).all()
    }
    metrics = compute_metrics(session)

    items = []
    for r in REWARDS:
        earned_record = earned_map.get(r["key"])
        is_hidden = r.get("hidden", False)
        is_earned = earned_record is not None
        items.append({
            "key": r["key"],
            "name": r["name"],
            "description": r["description"] if (is_earned or not is_hidden) else "???",
            "gift": r["gift"] if (is_earned or not is_hidden) else "???",
            "icon": r["icon"] if (is_earned or not is_hidden) else "🔒",
            "tier": r["tier"],
            "hidden": is_hidden,
            "condition": r["condition"],
            "threshold": r["threshold"],
            "earned": is_earned,
            "earned_at": earned_record.earned_at.isoformat() if earned_record else None,
            "is_seen": earned_record.is_seen if earned_record else True,
            "progress_pct": progress_pct(r, metrics) if (not is_earned and not is_hidden) else (100.0 if is_earned else 0.0),
        })

    unseen_count = sum(1 for r in items if r["earned"] and not r["is_seen"])
    earned_count = sum(1 for r in items if r["earned"])

    return {
        "rewards_enabled": rewards_enabled,
        "metrics": metrics,
        "rewards": items,
        "unseen_count": unseen_count,
        "earned_count": earned_count,
        "total_count": len(REWARDS),
    }
