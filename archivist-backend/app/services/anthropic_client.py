import logging
from typing import Optional
from anthropic import Anthropic
from ..core.config import settings

logger = logging.getLogger(__name__)
_client: Optional[Anthropic] = None


def get_client() -> Optional[Anthropic]:
    global _client
    if not settings.ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY not set — AI features disabled")
        return None
    if _client is None:
        _client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


def get_model() -> str:
    return settings.ANTHROPIC_MODEL


def get_max_tokens() -> int:
    return settings.ANTHROPIC_MAX_TOKENS
