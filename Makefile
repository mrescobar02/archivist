.PHONY: backend frontend

backend:
	cd backend && uv run python -m uvicorn main:app --reload --port 8000

frontend:
	cd frontend && pnpm dev
