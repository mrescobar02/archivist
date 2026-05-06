import logging
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv()

from fastapi.encoders import ENCODERS_BY_TYPE
ENCODERS_BY_TYPE[Decimal] = float

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.config import settings
from app.db.session import create_db_and_tables, get_session
from app.models import *  # noqa: F401,F403 — registers all models with SQLModel metadata
from app.routers import (
    accounts, categories, incomes, expenses, fixed_expenses,
    transfers, goals, savings, debts, distribution, dashboard,
    advisor, receipts, csv, profile, journal, rewards, chat,
)
from app.services.seed import seed_categories
from app.services.groq_client import get_client
from sqlmodel import Session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="The Archivist",
    description="Household Finance Management API",
    version="1.0.0",
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
    from app.db.session import engine
    from sqlalchemy import text
    with Session(engine) as session:
        seed_categories(session)
        # Migrate: add rewards_enabled to user_profile if missing
        for ddl in [
            "ALTER TABLE user_profile ADD COLUMN rewards_enabled BOOLEAN NOT NULL DEFAULT 1",
            "ALTER TABLE user_profile ADD COLUMN language VARCHAR NOT NULL DEFAULT 'es'",
            "ALTER TABLE debts ADD COLUMN cut_date INTEGER",
            "ALTER TABLE debts ADD COLUMN payment_due_day INTEGER",
        ]:
            try:
                session.exec(text(ddl))
                session.commit()
            except Exception:
                pass  # column already exists
    # Log AI status
    client = get_client()
    if client:
        logger.info("Groq AI client initialized")
    else:
        logger.warning("GROQ_API_KEY not set — AI features disabled")


@app.get("/")
def root():
    return {"name": "The Archivist", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


# Routers
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
