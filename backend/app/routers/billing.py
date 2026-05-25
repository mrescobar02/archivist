import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from ..core.auth import get_current_user, CurrentUser
from ..core.billing import invalidate_cache
from ..core.config import settings

router = APIRouter(prefix="/billing", tags=["billing"])
logger = logging.getLogger(__name__)


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str


@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout(current_user: CurrentUser = Depends(get_current_user)):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing not configured")
    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY

        customers = stripe.Customer.list(email=current_user.email, limit=1)
        if customers.data:
            customer_id = customers.data[0].id
        else:
            customer = stripe.Customer.create(email=current_user.email)
            customer_id = customer.id

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": settings.STRIPE_PRO_PRICE_ID, "quantity": 1}],
            mode="subscription",
            success_url=f"{settings.SITE_URL}/profile?upgraded=1",
            cancel_url=f"{settings.SITE_URL}/profile",
        )
        return CheckoutResponse(checkout_url=session.url)
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/portal", response_model=PortalResponse)
def create_portal(current_user: CurrentUser = Depends(get_current_user)):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing not configured")
    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY

        customers = stripe.Customer.list(email=current_user.email, limit=1)
        if not customers.data:
            raise HTTPException(status_code=404, detail="No billing account found")

        portal = stripe.billing_portal.Session.create(
            customer=customers.data[0].id,
            return_url=f"{settings.SITE_URL}/profile",
        )
        return PortalResponse(portal_url=portal.url)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stripe portal error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create portal session")


@router.post("/webhook", status_code=200)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
):
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook not configured")
    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        body = await request.body()
        event = stripe.Webhook.construct_event(
            body, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        logger.error(f"Stripe webhook error: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event["type"]
    logger.info(f"Stripe webhook: {event_type}")

    if event_type in ("checkout.session.completed", "customer.subscription.deleted"):
        customer_id = event["data"]["object"].get("customer")
        if customer_id:
            try:
                import stripe as _stripe
                _stripe.api_key = settings.STRIPE_SECRET_KEY
                customer = _stripe.Customer.retrieve(customer_id)
                email = customer.get("email", "")
                if email:
                    invalidate_cache(email)
                    logger.info(f"Invalidated billing cache for {email}")
            except Exception as e:
                logger.warning(f"Could not invalidate cache: {e}")

    return {"received": True}
