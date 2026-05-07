import time
from fastapi import Depends, HTTPException
from .config import settings
from .auth import get_current_user, CurrentUser

_pro_cache: dict[str, tuple[bool, float]] = {}
_CACHE_TTL = 300  # 5 minutes


def _is_pro(user_email: str) -> bool:
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_PRO_PRICE_ID:
        return True  # beta / unconfigured → allow all

    now = time.time()
    cached = _pro_cache.get(user_email)
    if cached and now - cached[1] < _CACHE_TTL:
        return cached[0]

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        customers = stripe.Customer.list(email=user_email, limit=1)
        if not customers.data:
            _pro_cache[user_email] = (False, now)
            return False
        subs = stripe.Subscription.list(
            customer=customers.data[0].id,
            price=settings.STRIPE_PRO_PRICE_ID,
            status="active",
            limit=1,
        )
        result = len(subs.data) > 0
        _pro_cache[user_email] = (result, now)
        return result
    except Exception:
        return False


def invalidate_cache(user_email: str) -> None:
    _pro_cache.pop(user_email, None)


def require_pro(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if not _is_pro(current_user.email):
        raise HTTPException(status_code=402, detail="Se requiere plan Pro")
    return current_user
