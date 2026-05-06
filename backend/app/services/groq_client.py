import logging
from typing import Optional
from groq import Groq, AsyncGroq
from ..core.config import settings

logger = logging.getLogger(__name__)
_client: Optional[Groq] = None
_async_client: Optional[AsyncGroq] = None


def get_client() -> Optional[Groq]:
    global _client
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set — AI features disabled")
        return None
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def get_async_client() -> Optional[AsyncGroq]:
    global _async_client
    if not settings.GROQ_API_KEY:
        return None
    if _async_client is None:
        _async_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _async_client


def get_model() -> str:
    return settings.GROQ_MODEL


def get_vision_model() -> str:
    return settings.GROQ_VISION_MODEL


def get_max_tokens() -> int:
    return settings.GROQ_MAX_TOKENS
