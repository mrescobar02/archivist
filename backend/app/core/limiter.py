from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request
from .auth import bearer_scheme, _decode_token


def _get_user_key(request: Request) -> str:
    """Rate limit by user_id when authenticated, fall back to IP."""
    try:
        credentials = request.headers.get("authorization", "")
        if credentials.startswith("Bearer "):
            token = credentials.split(" ", 1)[1]
            payload = _decode_token(token)
            uid = payload.get("sub")
            if uid:
                return f"user:{uid}"
    except Exception:
        pass
    return get_remote_address(request)


limiter = Limiter(key_func=_get_user_key, default_limits=["300/hour"])
