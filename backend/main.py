import logging
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv()

from fastapi.encoders import ENCODERS_BY_TYPE
ENCODERS_BY_TYPE[Decimal] = float

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import create_db_and_tables
from app.models import *  # noqa: F401,F403 — registers all models with SQLModel metadata
from app.routers import (
    accounts, categories, incomes, expenses, fixed_expenses,
    transfers, goals, savings, debts, distribution, dashboard,
    advisor, receipts, csv, profile, journal, rewards, chat,
)
from app.routers import billing
from app.services.groq_client import get_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="The Archivist",
    description="Household Finance Management API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    client = get_client()
    if client:
        logger.info("Groq AI client initialized")
    else:
        logger.warning("GROQ_API_KEY not set — AI features disabled")
    if not settings.SUPABASE_JWT_SECRET:
        logger.warning("SUPABASE_JWT_SECRET not set — running in dev mode (no JWT verification)")
    if not settings.STRIPE_SECRET_KEY:
        logger.warning("STRIPE_SECRET_KEY not set — all users have Pro access (beta mode)")


@app.get("/")
def root():
    return {"name": "The Archivist", "version": "2.0.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(accounts.router)
app.include_router(categories.router)
app.include_router(incomes.router)
app.include_router(expenses.router)
app.include_router(fixed_expenses.router)
app.include_router(transfers.router)
app.include_router(goals.router)
app.include_router(savings.router)
app.include_router(debts.router)
app.include_router(distribution.router)
app.include_router(dashboard.router)
app.include_router(advisor.router)
app.include_router(receipts.router)
app.include_router(csv.router)
app.include_router(profile.router)
app.include_router(journal.router)
app.include_router(rewards.router)
app.include_router(chat.router)
app.include_router(billing.router)
