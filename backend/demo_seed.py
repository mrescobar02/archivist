"""
Demo seed — wipes non-category data and inserts a coherent household dataset.
Run: python demo_seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from datetime import date, datetime
from decimal import Decimal
from sqlmodel import Session, select, delete

from app.db.session import engine, create_db_and_tables
from app.models import *  # noqa
from app.models.profile import UserProfile
from app.models.journal import JournalEntry
from app.models.distribution import IncomeDistribution


def d(s): return date.fromisoformat(s)
def dec(v): return Decimal(str(v))


def wipe(session):
    for model in [
        JournalEntry, UserProfile, IncomeDistribution,
        SavingsContribution, SavingsFund,
        DebtPayment, Debt,
        Goal, Transfer,
        Expense, Income,
        FixedExpense, Account,
    ]:
        session.exec(delete(model))
    session.commit()
    print("Wiped existing data.")


def seed(session):
    cats = {c.name: c.id for c in session.exec(select(Category)).all()}

    # ── Accounts ─────────────────────────────────────────────────────────────
    checking  = Account(name="Banco Principal",    type=AccountType.checking, initial_balance=dec("1500"), balance=dec("1500"))
    savings_a = Account(name="Cuenta de Ahorros", type=AccountType.savings,  initial_balance=dec("5000"), balance=dec("5000"))
    cash_a    = Account(name="Efectivo",           type=AccountType.cash,     initial_balance=dec("300"),  balance=dec("300"))
    session.add_all([checking, savings_a, cash_a])
    session.flush()
    ch, sa, ca = checking.id, savings_a.id, cash_a.id

    # ── Incomes ───────────────────────────────────────────────────────────────
    raw_incomes = [
        # Feb
        (dec("4200"), d("2026-02-01"), "salary", "Salario Isaac", "Desarrollo de software", ch),
        (dec("2600"), d("2026-02-05"), "salary", "Salario Esposa", "Magisterio — pago mensual", ch),
        (dec("650"),  d("2026-02-18"), "freelance", "Freelance", "Proyecto web — cliente externo", ch),
        # Mar
        (dec("4200"), d("2026-03-01"), "salary", "Salario Isaac", "Desarrollo de software", ch),
        (dec("2600"), d("2026-03-05"), "salary", "Salario Esposa", "Magisterio — pago mensual", ch),
        # Apr
        (dec("4200"), d("2026-04-01"), "salary", "Salario Isaac", "Desarrollo de software", ch),
        (dec("2600"), d("2026-04-05"), "salary", "Salario Esposa", "Magisterio — pago mensual", ch),
        (dec("450"),  d("2026-04-22"), "freelance", "Freelance", "Consultoría técnica — startup local", ch),
        # May (current)
        (dec("4200"), d("2026-05-01"), "salary", "Salario Isaac", "Desarrollo de software", ch),
        (dec("2600"), d("2026-05-05"), "salary", "Salario Esposa", "Magisterio — pago mensual", ch),
    ]
    for amount, date_, type_, source, desc, acc_id in raw_incomes:
        session.add(Income(amount=amount, date=date_, type=type_, source=source, description=desc, account_id=acc_id))
        session.get(Account, acc_id).balance += amount
    session.flush()

    # ── Expenses ─────────────────────────────────────────────────────────────
    def exp(amount, dt, desc, cat, acc=None, fixed=False):
        acc = acc or ch
        session.add(Expense(
            amount=dec(str(amount)), date=d(dt), description=desc,
            category_id=cats.get(cat), account_id=acc,
            expense_type="fixed" if fixed else "variable",
        ))
        session.get(Account, acc).balance -= dec(str(amount))

    # ── FEBRUARY ─────────────────────────────────────────────────────────────
    exp(1350,   "2026-02-01", "Renta — Febrero",               "Housing",       ch, True)
    exp(280,    "2026-02-01", "Seguro médico familiar",         "Health",        ch, True)
    exp(680,    "2026-02-01", "Diezmo — Febrero",              "Other",         ch, True)
    exp(285,    "2026-02-01", "Pago préstamo auto",             "Transport",     ch, True)
    exp(75,     "2026-02-01", "Pago mínimo tarjeta crédito",   "Other",         ch, True)
    exp(180,    "2026-02-15", "Préstamo educativo",            "Education",     ch, True)
    exp(95,     "2026-02-08", "Electricidad CFE",              "Utilities",     ch, True)
    exp(40,     "2026-02-12", "Agua y alcantarillado",          "Utilities",     ch, True)
    exp(75,     "2026-02-05", "Internet Telmex",               "Utilities",     ch, True)
    exp(120,    "2026-02-10", "Teléfonos celulares",           "Utilities",     ch, True)
    exp(15.49,  "2026-02-15", "Netflix",                       "Entertainment", ch, True)
    exp(10.99,  "2026-02-15", "Spotify Premium",               "Entertainment", ch, True)
    exp(14.99,  "2026-02-15", "Amazon Prime",                  "Shopping",      ch, True)
    exp(45,     "2026-02-01", "Gimnasio — mensualidad",        "Health",        ch, True)
    exp(150,    "2026-02-03", "Colegio niños — cuota",         "Education",     ch, True)
    exp(487.50, "2026-02-07", "Despensa — Walmart",            "Food")
    exp(68.20,  "2026-02-09", "Restaurante La Hacienda",       "Food")
    exp(145.30, "2026-02-14", "Cena San Valentín",             "Food")
    exp(52.40,  "2026-02-03", "Gasolina",                      "Transport")
    exp(54.80,  "2026-02-12", "Gasolina",                      "Transport")
    exp(49.60,  "2026-02-22", "Gasolina",                      "Transport")
    exp(38.90,  "2026-02-19", "Farmacia — medicamentos",        "Health")
    exp(67,     "2026-02-21", "Ropa — Zara kids",              "Shopping")
    exp(24.99,  "2026-02-26", "Uber — salida nocturna",        "Transport")
    exp(35,     "2026-02-28", "Material escolar",              "Education")

    # ── MARCH ────────────────────────────────────────────────────────────────
    exp(1350,   "2026-03-01", "Renta — Marzo",                  "Housing",       ch, True)
    exp(280,    "2026-03-01", "Seguro médico familiar",         "Health",        ch, True)
    exp(680,    "2026-03-01", "Diezmo — Marzo",                "Other",         ch, True)
    exp(285,    "2026-03-01", "Pago préstamo auto",             "Transport",     ch, True)
    exp(75,     "2026-03-01", "Pago mínimo tarjeta crédito",   "Other",         ch, True)
    exp(180,    "2026-03-15", "Préstamo educativo",            "Education",     ch, True)
    exp(95,     "2026-03-08", "Electricidad CFE",              "Utilities",     ch, True)
    exp(40,     "2026-03-12", "Agua y alcantarillado",          "Utilities",     ch, True)
    exp(75,     "2026-03-05", "Internet Telmex",               "Utilities",     ch, True)
    exp(120,    "2026-03-10", "Teléfonos celulares",           "Utilities",     ch, True)
    exp(15.49,  "2026-03-15", "Netflix",                       "Entertainment", ch, True)
    exp(10.99,  "2026-03-15", "Spotify Premium",               "Entertainment", ch, True)
    exp(14.99,  "2026-03-15", "Amazon Prime",                  "Shopping",      ch, True)
    exp(45,     "2026-03-01", "Gimnasio — mensualidad",        "Health",        ch, True)
    exp(150,    "2026-03-03", "Colegio niños — cuota",         "Education",     ch, True)
    exp(512.30, "2026-03-06", "Despensa — Walmart",            "Food")
    exp(78.50,  "2026-03-11", "Restaurante El Fogón",          "Food")
    exp(43.20,  "2026-03-17", "Pizza Hut — familia",           "Food")
    exp(92,     "2026-03-23", "Sushi — cena especial",         "Food")
    exp(51.40,  "2026-03-04", "Gasolina",                      "Transport")
    exp(53.20,  "2026-03-14", "Gasolina",                      "Transport")
    exp(55.80,  "2026-03-25", "Gasolina",                      "Transport")
    exp(120,    "2026-03-15", "Consulta médica",               "Health")
    exp(89.50,  "2026-03-22", "Farmacia — antibióticos",       "Health")
    exp(145,    "2026-03-18", "Ropa — Zara adultos",           "Shopping")
    exp(67.90,  "2026-03-28", "Amazon — artículos hogar",      "Shopping")
    exp(320,    "2026-03-20", "Mantenimiento auto",             "Transport")

    # ── APRIL ────────────────────────────────────────────────────────────────
    exp(1350,   "2026-04-01", "Renta — Abril",                  "Housing",       ch, True)
    exp(280,    "2026-04-01", "Seguro médico familiar",         "Health",        ch, True)
    exp(680,    "2026-04-01", "Diezmo — Abril",                "Other",         ch, True)
    exp(285,    "2026-04-01", "Pago préstamo auto",             "Transport",     ch, True)
    exp(75,     "2026-04-01", "Pago mínimo tarjeta crédito",   "Other",         ch, True)
    exp(180,    "2026-04-15", "Préstamo educativo",            "Education",     ch, True)
    exp(95,     "2026-04-08", "Electricidad CFE",              "Utilities",     ch, True)
    exp(40,     "2026-04-12", "Agua y alcantarillado",          "Utilities",     ch, True)
    exp(75,     "2026-04-05", "Internet Telmex",               "Utilities",     ch, True)
    exp(120,    "2026-04-10", "Teléfonos celulares",           "Utilities",     ch, True)
    exp(15.49,  "2026-04-15", "Netflix",                       "Entertainment", ch, True)
    exp(10.99,  "2026-04-15", "Spotify Premium",               "Entertainment", ch, True)
    exp(14.99,  "2026-04-15", "Amazon Prime",                  "Shopping",      ch, True)
    exp(45,     "2026-04-01", "Gimnasio — mensualidad",        "Health",        ch, True)
    exp(150,    "2026-04-03", "Colegio niños — cuota",         "Education",     ch, True)
    exp(54.99,  "2026-04-22", "Adobe Creative Cloud",          "Education",     ch, True)
    exp(498.70, "2026-04-05", "Despensa — Walmart",            "Food")
    exp(85.40,  "2026-04-10", "Restaurante italiano",          "Food")
    exp(36.80,  "2026-04-16", "Dominos — viernes familia",     "Food")
    exp(55.90,  "2026-04-24", "Cafetería y snacks",            "Food")
    exp(52.10,  "2026-04-03", "Gasolina",                      "Transport")
    exp(49.80,  "2026-04-15", "Gasolina",                      "Transport")
    exp(56.40,  "2026-04-27", "Gasolina",                      "Transport")
    exp(245,    "2026-04-18", "Dentista — limpieza familiar",  "Health")
    exp(34.50,  "2026-04-25", "Farmacia — vitaminas",          "Health")
    exp(189,    "2026-04-20", "Tenis Nike — hijo mayor",       "Shopping")
    exp(112.50, "2026-04-29", "Libros escolares",              "Education")
    exp(68,     "2026-04-12", "Cine — familia",                "Entertainment")
    exp(42,     "2026-04-26", "Parque de diversiones",         "Entertainment")

    # ── MAY (current month — días 1-3) ────────────────────────────────────────
    exp(1350,   "2026-05-01", "Renta — Mayo",                   "Housing",       ch, True)
    exp(280,    "2026-05-01", "Seguro médico familiar",         "Health",        ch, True)
    exp(680,    "2026-05-01", "Diezmo — Mayo",                 "Other",         ch, True)
    exp(285,    "2026-05-01", "Pago préstamo auto",             "Transport",     ch, True)
    exp(75,     "2026-05-01", "Pago mínimo tarjeta crédito",   "Other",         ch, True)
    exp(45,     "2026-05-01", "Gimnasio — mensualidad",        "Health",        ch, True)
    exp(38.50,  "2026-05-02", "Super — compras rápidas",       "Food")
    exp(55,     "2026-05-03", "Gasolina",                      "Transport")
    session.flush()

    # ── Transfers (checking → savings) ───────────────────────────────────────
    for amount, dt, note in [
        (dec("780"),  d("2026-02-28"), "Ahorro mensual — feb"),
        (dec("870"),  d("2026-03-31"), "Ahorro mensual — mar"),
        (dec("1050"), d("2026-04-30"), "Ahorro mensual — abr"),
    ]:
        session.add(Transfer(from_account_id=ch, to_account_id=sa, amount=amount, date=dt, note=note))
        session.get(Account, ch).balance -= amount
        session.get(Account, sa).balance += amount
    session.flush()

    # ── Fixed Expenses (reminders) ────────────────────────────────────────────
    session.add_all([
        FixedExpense(name="Renta / Alquiler",       amount=dec("1350"),  category_id=cats.get("Housing"),       payment_day=1,  frequency=Frequency.monthly, last_paid=d("2026-05-01"), account_id=ch),
        FixedExpense(name="Seguro Médico Familiar", amount=dec("280"),   category_id=cats.get("Health"),        payment_day=1,  frequency=Frequency.monthly, last_paid=d("2026-05-01"), account_id=ch),
        FixedExpense(name="Diezmo",                 amount=dec("680"),   category_id=cats.get("Other"),         payment_day=1,  frequency=Frequency.monthly, last_paid=d("2026-05-01"), account_id=ch),
        FixedExpense(name="Préstamo Auto",          amount=dec("285"),   category_id=cats.get("Transport"),     payment_day=1,  frequency=Frequency.monthly, last_paid=d("2026-05-01"), account_id=ch),
        FixedExpense(name="Gimnasio",               amount=dec("45"),    category_id=cats.get("Health"),        payment_day=1,  frequency=Frequency.monthly, last_paid=d("2026-05-01"), account_id=ch),
        FixedExpense(name="Internet Telmex",        amount=dec("75"),    category_id=cats.get("Utilities"),     payment_day=5,  frequency=Frequency.monthly, last_paid=d("2026-04-05"), account_id=ch),
        FixedExpense(name="Teléfonos Celulares",    amount=dec("120"),   category_id=cats.get("Utilities"),     payment_day=10, frequency=Frequency.monthly, last_paid=d("2026-04-10"), account_id=ch),
        FixedExpense(name="Electricidad CFE",       amount=dec("95"),    category_id=cats.get("Utilities"),     payment_day=8,  frequency=Frequency.monthly, last_paid=d("2026-04-08"), account_id=ch),
        FixedExpense(name="Agua y Alcantarillado",  amount=dec("40"),    category_id=cats.get("Utilities"),     payment_day=12, frequency=Frequency.monthly, last_paid=d("2026-04-12"), account_id=ch),
        FixedExpense(name="Colegio — cuota mensual",amount=dec("150"),   category_id=cats.get("Education"),     payment_day=3,  frequency=Frequency.monthly, last_paid=d("2026-04-03"), account_id=ch),
        FixedExpense(name="Préstamo Educativo",     amount=dec("180"),   category_id=cats.get("Education"),     payment_day=15, frequency=Frequency.monthly, last_paid=d("2026-04-15"), account_id=ch),
        FixedExpense(name="Netflix",                amount=dec("15.49"), category_id=cats.get("Entertainment"), payment_day=15, frequency=Frequency.monthly, last_paid=d("2026-04-15"), account_id=ch, renewal_date=d("2026-12-15")),
        FixedExpense(name="Spotify Premium",        amount=dec("10.99"), category_id=cats.get("Entertainment"), payment_day=15, frequency=Frequency.monthly, last_paid=d("2026-04-15"), account_id=ch, renewal_date=d("2026-09-15")),
        FixedExpense(name="Amazon Prime",           amount=dec("14.99"), category_id=cats.get("Shopping"),      payment_day=20, frequency=Frequency.monthly, last_paid=d("2026-04-15"), account_id=ch, renewal_date=d("2027-01-20")),
        FixedExpense(name="Adobe Creative Cloud",   amount=dec("54.99"), category_id=cats.get("Education"),     payment_day=22, frequency=Frequency.monthly, last_paid=d("2026-04-22"), account_id=ch, renewal_date=d("2026-11-22")),
        FixedExpense(name="Antivirus — licencia",   amount=dec("29.99"), category_id=cats.get("Other"),         payment_day=17, frequency=Frequency.yearly,  last_paid=d("2025-11-17"), account_id=ch, renewal_date=d("2026-11-17")),
    ])
    session.flush()

    # ── Goals ─────────────────────────────────────────────────────────────────
    g1 = Goal(name="Fondo de Emergencia",    target_amount=dec("15000"), current_amount=dec("9130"),  icon="🛡️", target_date=d("2026-12-31"))
    g2 = Goal(name="Vacaciones Familiares",  target_amount=dec("3500"),  current_amount=dec("1650"),  icon="✈️", target_date=d("2026-12-15"))
    g3 = Goal(name="Auto Nuevo",             target_amount=dec("12000"), current_amount=dec("0"),     icon="🚗", target_date=d("2028-01-01"))
    g4 = Goal(name="Portafolio de Inversión",target_amount=dec("5000"),  current_amount=dec("0"),     icon="📈", target_date=d("2027-06-01"))
    session.add_all([g1, g2, g3, g4])
    session.flush()

    # ── Savings Funds & Contributions ─────────────────────────────────────────
    sf1 = SavingsFund(name="Fondo de Emergencia", amount=dec("9130"), goal_id=g1.id)
    sf2 = SavingsFund(name="Vacaciones 2026",     amount=dec("1650"), goal_id=g2.id)
    sf3 = SavingsFund(name="Ahorro General",      amount=dec("2420"), goal_id=None)
    session.add_all([sf1, sf2, sf3])
    session.flush()

    session.add_all([
        SavingsContribution(fund_id=sf1.id, amount=dec("180"),  date=d("2026-02-28"), note="Transferencia mensual — feb"),
        SavingsContribution(fund_id=sf1.id, amount=dec("200"),  date=d("2026-03-31"), note="Transferencia mensual — mar"),
        SavingsContribution(fund_id=sf1.id, amount=dec("250"),  date=d("2026-04-30"), note="Transferencia mensual — abr"),
        SavingsContribution(fund_id=sf2.id, amount=dec("100"),  date=d("2026-02-28"), note="Ahorro vacaciones — feb"),
        SavingsContribution(fund_id=sf2.id, amount=dec("150"),  date=d("2026-03-31"), note="Ahorro vacaciones — mar"),
        SavingsContribution(fund_id=sf2.id, amount=dec("200"),  date=d("2026-04-30"), note="Ahorro vacaciones — abr"),
        SavingsContribution(fund_id=sf3.id, amount=dec("500"),  date=d("2026-02-28"), note="Ahorro mensual — feb"),
        SavingsContribution(fund_id=sf3.id, amount=dec("420"),  date=d("2026-03-31"), note="Ahorro mensual — mar"),
        SavingsContribution(fund_id=sf3.id, amount=dec("600"),  date=d("2026-04-30"), note="Ahorro mensual — abr (incluye freelance)"),
    ])
    session.flush()

    # Sync savings account balance with fund totals
    session.get(Account, sa).balance = dec("9130") + dec("1650") + dec("2420")
    session.flush()

    # ── Debts ─────────────────────────────────────────────────────────────────
    dc = Debt(name="Tarjeta de Crédito Banamex", creditor="Banamex",         total_amount=dec("4500"),  remaining_balance=dec("2340"),  interest_rate=dec("19.99"), minimum_payment=dec("75"))
    da = Debt(name="Préstamo Auto — Nissan",     creditor="BBVA Automotriz", total_amount=dec("18000"), remaining_balance=dec("11250"), interest_rate=dec("8.50"),  minimum_payment=dec("285"))
    de = Debt(name="Préstamo Educativo",         creditor="Banco Bienestar", total_amount=dec("12000"), remaining_balance=dec("7800"),  interest_rate=dec("4.50"),  minimum_payment=dec("180"))
    session.add_all([dc, da, de])
    session.flush()

    session.add_all([
        DebtPayment(debt_id=dc.id, amount=dec("150"), date=d("2026-02-01"), note="Pago doble"),
        DebtPayment(debt_id=dc.id, amount=dec("75"),  date=d("2026-03-01"), note="Pago mínimo"),
        DebtPayment(debt_id=dc.id, amount=dec("75"),  date=d("2026-04-01"), note="Pago mínimo"),
        DebtPayment(debt_id=dc.id, amount=dec("75"),  date=d("2026-05-01"), note="Pago mínimo"),
        DebtPayment(debt_id=da.id, amount=dec("285"), date=d("2026-02-01"), note="Cuota mensual"),
        DebtPayment(debt_id=da.id, amount=dec("285"), date=d("2026-03-01"), note="Cuota mensual"),
        DebtPayment(debt_id=da.id, amount=dec("285"), date=d("2026-04-01"), note="Cuota mensual"),
        DebtPayment(debt_id=da.id, amount=dec("285"), date=d("2026-05-01"), note="Cuota mensual"),
        DebtPayment(debt_id=de.id, amount=dec("180"), date=d("2026-02-15"), note="Cuota mensual"),
        DebtPayment(debt_id=de.id, amount=dec("180"), date=d("2026-03-15"), note="Cuota mensual"),
        DebtPayment(debt_id=de.id, amount=dec("180"), date=d("2026-04-15"), note="Cuota mensual"),
    ])
    session.flush()

    # ── Distribution ─────────────────────────────────────────────────────────
    session.add_all([
        IncomeDistribution(category="vivienda",         percentage=dec("19")),
        IncomeDistribution(category="gastos_variables", percentage=dec("16")),
        IncomeDistribution(category="diezmo",           percentage=dec("10")),
        IncomeDistribution(category="ahorros",          percentage=dec("13")),
        IncomeDistribution(category="metas",            percentage=dec("8")),
        IncomeDistribution(category="deudas",           percentage=dec("11")),
        IncomeDistribution(category="transporte",       percentage=dec("9")),
        IncomeDistribution(category="servicios",        percentage=dec("7")),
        IncomeDistribution(category="salud",            percentage=dec("5")),
        IncomeDistribution(category="educacion",        percentage=dec("2")),
    ])
    session.flush()

    # ── Profile ───────────────────────────────────────────────────────────────
    session.add(UserProfile(
        id=1,
        display_name="Isaac",
        financial_status=(
            "Desarrollador de software (32 años). Mi esposa es maestra. "
            "Dos hijos en primaria. Ingreso combinado ~$6,800/mes neto. "
            "Tres deudas activas: tarjeta de crédito (19.99%), préstamo auto y préstamo estudiantil."
        ),
        financial_goals_text=(
            "1) Eliminar deuda de tarjeta de crédito antes de dic-2026. "
            "2) Completar fondo de emergencia a $15,000. "
            "3) Ahorrar $3,500 para vacaciones familiares en diciembre. "
            "4) Iniciar inversiones en ETFs indexados en 2027."
        ),
        concerns=(
            "Gastamos demasiado en restaurantes (~$200-300/mes). "
            "La tarjeta al 19.99% consume mucho en intereses — quiero liquidarla ya. "
            "No tenemos ninguna inversión y siento que el tiempo corre."
        ),
        risk_tolerance="moderate",
        notes=(
            "Recibo freelance ocasional de $400-700 extra. "
            "El diezmo ($680/mes) es no negociable para nuestra familia. "
            "Mi esposa y yo manejamos las finanzas juntos."
        ),
        updated_at=datetime.utcnow(),
    ))
    session.flush()

    # ── Journal Entries ───────────────────────────────────────────────────────
    session.add_all([
        JournalEntry(
            title="La tarjeta me está ahogando",
            content="Este mes de febrero apenas pude hacer el pago mínimo de la tarjeta. El interés del 19.99% es brutal — cada mes casi todo el pago se va en intereses. Necesito un plan agresivo para eliminarla este año. ¿Debería pausar los ahorros de vacaciones y enfocar ese dinero en la tarjeta?",
            mood="stressed", created_at=datetime(2026,2,15), updated_at=datetime(2026,2,15)),
        JournalEntry(
            title="Gastos médicos inesperados en marzo",
            content="El niño mayor se enfermó y pagamos $209 entre consulta y antibióticos. No estaban planeados. Por suerte no tuvimos que usar la tarjeta — gracias al fondo de emergencia que estamos construyendo. Esto me refuerza que 3 meses de gastos de respaldo es lo mínimo.",
            mood="neutral", created_at=datetime(2026,3,24), updated_at=datetime(2026,3,24)),
        JournalEntry(
            title="Abril fue positivo — llegó el freelance",
            content="El proyecto de consultoría ($450) llegó en buen momento y pudimos transferir $1,050 al ahorro. También fuimos al cine y al parque con los niños — costó pero valió la pena. Noto que el entretenimiento se me puede ir de las manos si no le pongo límite semanal.",
            mood="positive", created_at=datetime(2026,4,30), updated_at=datetime(2026,4,30)),
        JournalEntry(
            title="¿Cuándo voy a invertir?",
            content="Tengo 32 años y cero inversiones. Cada año que pasa es dinero que no trabaja. Mi plan: (1) liquidar tarjeta de crédito a fin de año, (2) completar fondo de emergencia, (3) en enero 2027 abrir cuenta de inversión con ETFs. Quiero preguntarle al asesor si tiene sentido ese orden o si debería invertir algo en paralelo.",
            mood="neutral", created_at=datetime(2026,4,28), updated_at=datetime(2026,4,28)),
        JournalEntry(
            title="Mayo: quiero controlar los restaurantes",
            content="En el primer trimestre gastamos un promedio de $212/mes en comida fuera. Meta de mayo: máximo $100 en restaurantes. Voy a proponerle a mi esposa cocinar juntos los domingos y preparar lonches para la semana. También quiero revisar si podemos pausar alguna suscripción.",
            mood="neutral", created_at=datetime(2026,5,3), updated_at=datetime(2026,5,3)),
    ])
    session.commit()

    # ── Summary ───────────────────────────────────────────────────────────────
    ch_b = session.get(Account, ch).balance
    sa_b = session.get(Account, sa).balance
    ca_b = session.get(Account, ca).balance
    print("\nDemo data seeded successfully.")
    print(f"  Banco Principal:   ${ch_b:>10,.2f}")
    print(f"  Cuenta de Ahorros: ${sa_b:>10,.2f}")
    print(f"  Efectivo:          ${ca_b:>10,.2f}")
    print(f"  Total:             ${ch_b+sa_b+ca_b:>10,.2f}")


if __name__ == "__main__":
    create_db_and_tables()
    with Session(engine) as session:
        wipe(session)
        seed(session)
