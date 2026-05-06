import os
import base64 as b64lib
import uuid
import logging
from typing import List
from decimal import Decimal
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel as PydanticBaseModel
from sqlmodel import Session, select
from ..db.session import get_session
from ..models.receipt_scan import ReceiptScan
from ..models.expense import Expense
from ..models.account import Account
from ..schemas.receipt_scan import ReceiptScanRead, ReceiptScanUpdate, ReceiptScanSave
from ..services.receipt_extraction import extract_from_image
from ..services.groq_client import get_client
from ..core.config import settings

router = APIRouter(prefix="/receipt", tags=["receipt"])
logger = logging.getLogger(__name__)


class AnalyzeBase64Request(PydanticBaseModel):
    image_base64: str
    image_media_type: str = "image/jpeg"


@router.post("/analyze")
def analyze_receipt_base64(body: AnalyzeBase64Request, session: Session = Depends(get_session)):
    if not get_client():
        raise HTTPException(status_code=503, detail="AI features not configured — set GROQ_API_KEY")
    try:
        image_bytes = b64lib.b64decode(body.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")
    try:
        extracted = extract_from_image(image_bytes, body.image_media_type, session)
        return extracted
    except Exception as e:
        logger.error(f"Receipt analysis failed: {e}")
        raise HTTPException(status_code=422, detail=str(e))

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10MB


@router.post("/scan", response_model=ReceiptScanRead, status_code=201)
async def scan_receipt(
    image: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    if not get_client():
        raise HTTPException(status_code=503, detail="AI features not configured — set ANTHROPIC_API_KEY")

    content_type = image.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image type. Use JPEG, PNG, or WebP")

    image_bytes = await image.read()
    if len(image_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 10MB)")

    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{uuid.uuid4()}{os.path.splitext(image.filename or '.jpg')[1]}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    scan = ReceiptScan(image_path=filepath, status="pending")
    session.add(scan)
    session.commit()
    session.refresh(scan)

    try:
        extracted = extract_from_image(image_bytes, content_type, session)
        scan.merchant = extracted.get("merchant")
        scan.amount = Decimal(str(extracted["amount"])) if extracted.get("amount") is not None else None
        scan.date = date.fromisoformat(extracted["date"]) if extracted.get("date") else None
        scan.category_id = extracted.get("category_id")
        scan.raw_text = extracted.get("raw_text", "")
        scan.status = "reviewed"
    except Exception as e:
        logger.error(f"Receipt extraction failed: {e}")
        scan.raw_text = str(e)
        scan.status = "failed"

    session.add(scan)
    session.commit()
    session.refresh(scan)
    return scan


@router.get("/scans", response_model=List[ReceiptScanRead])
def list_scans(session: Session = Depends(get_session)):
    return session.exec(select(ReceiptScan).order_by(ReceiptScan.created_at.desc()).limit(50)).all()


@router.put("/scans/{scan_id}", response_model=ReceiptScanRead)
def update_scan(scan_id: int, body: ReceiptScanUpdate, session: Session = Depends(get_session)):
    scan = session.get(ReceiptScan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Receipt scan not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(scan, field, value)
    scan.status = "reviewed"
    session.add(scan)
    session.commit()
    session.refresh(scan)
    return scan


@router.post("/scans/{scan_id}/save", response_model=ReceiptScanRead)
def save_scan_as_expense(scan_id: int, body: ReceiptScanSave, session: Session = Depends(get_session)):
    scan = session.get(ReceiptScan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Receipt scan not found")
    if not scan.amount or not scan.date:
        raise HTTPException(status_code=400, detail="Amount and date are required before saving")
    account = session.get(Account, body.account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    expense = Expense(
        amount=scan.amount,
        date=scan.date,
        category_id=scan.category_id,
        description=body.description or scan.merchant or "Receipt scan",
        account_id=body.account_id,
        expense_type=body.expense_type,
    )
    account.balance -= scan.amount
    scan.status = "saved"
    session.add(expense)
    session.add(account)
    session.add(scan)
    session.commit()
    session.refresh(scan)
    return scan


@router.delete("/scans/{scan_id}", status_code=204)
def delete_scan(scan_id: int, session: Session = Depends(get_session)):
    scan = session.get(ReceiptScan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Receipt scan not found")
    if scan.image_path and os.path.exists(scan.image_path):
        try:
            os.remove(scan.image_path)
        except OSError:
            pass
    session.delete(scan)
    session.commit()
