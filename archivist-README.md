# The Archivist — Household Finance Manager

A local-only household finance app. No auth, no cloud sync, single financial context.

## Stack

- **Backend**: Python + FastAPI + SQLModel + SQLite
- **Frontend**: React + TypeScript + Vite + TailwindCSS + React Query
- **AI**: Claude API for advisor chat and receipt OCR

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Start Both (macOS/Linux)

```bash
chmod +x scripts/start-all.sh
./scripts/start-all.sh
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:

```
ANTHROPIC_API_KEY=sk-ant-...   # Required for AI features
```

All other variables have sensible defaults.

## Features

| Section | What you can do |
|---------|----------------|
| **Overview** | Dashboard KPIs, income CRUD, expense CRUD |
| **Accounts** | Account cards, fund transfers |
| **Goals & Debts** | Goal progress tracking, debt payoff with payment log |
| **Budget** | Income allocation by percentage, savings fund management |
| **Reports** | Income vs expenses charts, net balance trend, savings overview |
| **AI Assistant** | Streaming financial advisor chat, receipt OCR to expense |

## Database

SQLite file at `backend/archivist.db` — created automatically on first run. 10 default expense categories are seeded.

## Notes

- AI features (advisor chat, receipt scanner) require a valid `ANTHROPIC_API_KEY`
- All data is stored locally; nothing leaves your machine
- CORS is configured for `localhost:5173` by default
