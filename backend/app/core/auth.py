import time
import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from .config import settings

bearer_scheme = HTTPBearer(auto_error=False)

_jwks_cache: dict = {"keys": [], "fetched_at": 0.0}
_JWKS_TTL = 3600  # re-fetch once per hour


def _get_jwks_keys() -> list:
    now = time.time()
    if now - _jwks_cache["fetched_at"] > _JWKS_TTL or not _jwks_cache["keys"]:
        try:
            url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
            resp = httpx.get(url, timeout=10)
            resp.raise_for_status()
            _jwks_cache["keys"] = resp.json().get("keys", [])
            _jwks_cache["fetched_at"] = now
        except Exception:
            pass  # keep stale cache on transient failure
    return _jwks_cache["keys"]


class CurrentUser(BaseModel):
    user_id: str
    email: str


def _decode_token(token: str) -> dict:
    # Dev mode: SUPABASE_URL not set → skip verification
    if not settings.SUPABASE_URL:
        try:
            return jwt.decode(token, options={"verify_signature": False})
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")

    # Primary: JWKS (ES256 — current Supabase default using ECC P-256)
    keys = _get_jwks_keys()
    for key in keys:
        try:
            alg = "ES256" if key.get("crv") == "P-256" else "RS256"
            return jwt.decode(token, key, algorithms=[alg], options={"verify_aud": False})
        except JWTError:
            continue

    # Fallback: legacy HS256 secret (if SUPABASE_JWT_SECRET is still set)
    if settings.SUPABASE_JWT_SECRET:
        try:
            return jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        except JWTError:
            pass

    raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = _decode_token(credentials.credentials)
        user_id: str = payload.get("sub", "")
        email: str = payload.get("email", "")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return CurrentUser(user_id=user_id, email=email)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
