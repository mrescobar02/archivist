import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from pydantic import BaseModel
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..core.billing import require_pro
from ..services.groq_client import get_async_client, get_model, get_vision_model, get_max_tokens
from ..services.advisor_context import build_context, build_system_prompt
from ..services.rewards import award_hidden_reward
from ..models.report import FinancialAnalysis

router = APIRouter(prefix="/advisor", tags=["advisor"])
logger = logging.getLogger(__name__)

MODE_INSTRUCTIONS = {
    "strict": """
ADVISOR MODE: EXTREMELY STRICT
You are a strict financial guardian. Your default stance is caution and restraint.
- For any purchase decision, start from "not justified" and require strong evidence to change that
- Always calculate opportunity cost: what goal does this money delay?
- Always suggest at least 2 cheaper alternatives
- Reference the user's specific goals by name and show how this spending affects them
- If a purchase is discretionary, challenge it firmly but respectfully
- Only endorse purchases that are clearly necessary or deeply aligned with stated goals
- Be direct, firm, and data-driven. Do not soften your assessment to please the user.
""",
    "moderate": """
ADVISOR MODE: MODERATE
You are a balanced advisor who weighs financial prudence against quality of life.
- For purchase decisions, objectively assess cost vs. benefit
- Note alignment or conflict with the user's stated goals
- Suggest a cheaper alternative only if one is clearly better value
- Support reasonable purchases that fit within the user's budget
- Be honest but not harsh. Present both sides fairly.
""",
    "second_opinion": """
ADVISOR MODE: SECOND OPINION ONLY
Your role is to inform, not to decide. The user is asking for a perspective, not a verdict.
- Acknowledge their reasoning and intent
- Point out any financial considerations they may not have thought of
- Present pros and cons briefly and objectively
- Do NOT push them toward or away from a decision
- Respect their autonomy. End with something like "ultimately, this is your call."
""",
}


class Message(BaseModel):
    role: str
    content: str


class AdvisorRequest(BaseModel):
    message: str
    history: List[Message] = []
    include_context: bool = True
    advisor_mode: str = "moderate"
    image_base64: Optional[str] = None
    image_media_type: Optional[str] = "image/jpeg"


@router.post("")
async def advisor_chat(
    request: Request,
    body: AdvisorRequest,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_pro),
):
    if not body.message and not body.image_base64:
        raise HTTPException(status_code=422, detail="message or image is required")

    msg_lower = (body.message or "").lower()
    PURCHASE_KEYWORDS = ["debo comprar", "debería comprar", "vale la pena", "conviene comprar",
                         "should i buy", "worth buying", "me recomiendas comprar",
                         "es buena idea comprar", "puedo comprar", "me conviene"]
    BUDGET_KEYWORDS   = ["presupuesto", "budget", "distribución de gastos", "cómo asignar",
                         "cuánto gastar", "regla 50", "50/30/20", "plan financiero",
                         "cómo organizar mis finanzas", "finanzas personales"]
    if any(kw in msg_lower for kw in PURCHASE_KEYWORDS):
        award_hidden_reward(session, "hidden_ask_before_buy", current_user.user_id)
    if any(kw in msg_lower for kw in BUDGET_KEYWORDS):
        award_hidden_reward(session, "hidden_budget_chat", current_user.user_id)
    from datetime import datetime as dt
    if dt.now().hour >= 22:
        award_hidden_reward(session, "hidden_night_owl", current_user.user_id)

    client = get_async_client()
    if not client:
        raise HTTPException(status_code=503, detail="AI features not configured — set GROQ_API_KEY")

    mode = body.advisor_mode if body.advisor_mode in MODE_INSTRUCTIONS else "moderate"
    mode_block = MODE_INSTRUCTIONS[mode]

    system_prompt = "You are a helpful household financial advisor."
    if body.include_context:
        ctx = build_context(session, current_user.user_id)
        system_prompt = build_system_prompt(ctx)

    system_prompt = system_prompt.rstrip() + "\n" + mode_block

    has_image = bool(body.image_base64)
    model = get_vision_model() if has_image else get_model()
    history_messages = [{"role": m.role, "content": m.content} for m in body.history]

    if has_image:
        user_content = [
            {"type": "text", "text": body.message or "Analyze this image in the context of my finances."},
            {"type": "image_url", "image_url": {"url": f"data:{body.image_media_type};base64,{body.image_base64}"}},
        ]
        current_message = {"role": "user", "content": user_content}
    else:
        current_message = {"role": "user", "content": body.message}

    messages = history_messages + [current_message]

    async def generate():
        try:
            stream = await client.chat.completions.create(
                model=model,
                max_tokens=get_max_tokens(),
                messages=[{"role": "system", "content": system_prompt}] + messages,
                stream=True,
            )
            async for chunk in stream:
                if await request.is_disconnected():
                    break
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    yield f"data: {json.dumps({'delta': delta})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            logger.error(f"Advisor stream error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


REPORT_PROMPT_ES = """Genera un informe financiero estructurado usando EXACTAMENTE este formato (sin cambiar los encabezados):

**Resumen**
[2-3 oraciones evaluando la salud financiera actual con números concretos del contexto]

**Observaciones clave**
• [observación específica con números reales]
• [observación específica con números reales]
• [observación específica con números reales]

**Recomendaciones**
• [acción concreta a tomar esta semana]
• [acción concreta para este mes]
• [acción concreta para mejorar a largo plazo]

Sé conciso (máx 280 palabras), usa números reales del contexto y mantén un tono alentador pero honesto."""

REPORT_PROMPT_EN = """Generate a structured financial report using EXACTLY this format (do not change the headings):

**Summary**
[2-3 sentences assessing current financial health with concrete numbers from the context]

**Key Insights**
• [specific observation with real numbers]
• [specific observation with real numbers]
• [specific observation with real numbers]

**Recommendations**
• [concrete action to take this week]
• [concrete action for this month]
• [concrete action for long-term improvement]

Be concise (max 280 words), use real numbers from the context, and keep an encouraging but honest tone."""


@router.post("/report")
async def financial_report(
    request: Request,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_pro),
):
    client = get_async_client()
    if not client:
        raise HTTPException(status_code=503, detail="AI features not configured — set GROQ_API_KEY")

    ctx = build_context(session, current_user.user_id)
    lang = ctx.get("profile", {}).get("language", "es")
    system = build_system_prompt(ctx)
    prompt = REPORT_PROMPT_EN if lang == "en" else REPORT_PROMPT_ES

    async def generate():
        try:
            stream = await client.chat.completions.create(
                model=get_model(),
                max_tokens=700,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                stream=True,
            )
            async for chunk in stream:
                if await request.is_disconnected():
                    break
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    yield f"data: {json.dumps({'delta': delta})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            logger.error(f"Report stream error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/report/saved")
def get_saved_analysis(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    analysis = session.exec(
        select(FinancialAnalysis)
        .where(FinancialAnalysis.user_id == current_user.user_id)
        .order_by(FinancialAnalysis.created_at.desc())
        .limit(1)
    ).first()
    if not analysis:
        return None
    return {"text": analysis.text, "created_at": analysis.created_at.isoformat()}


class SaveAnalysisBody(BaseModel):
    text: str


@router.post("/report/save")
def save_analysis(
    body: SaveAnalysisBody,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    analysis = FinancialAnalysis(user_id=current_user.user_id, text=body.text)
    session.add(analysis)
    session.commit()
    session.refresh(analysis)
    return {"id": analysis.id, "created_at": analysis.created_at.isoformat()}
