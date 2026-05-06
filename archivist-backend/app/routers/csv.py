import json
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from ..db.session import get_session
from ..models.csv_import import CsvImport
from ..models.income import Income
from ..models.expense import Expense
from ..models.account import Account
from ..models.category import Category
from ..schemas.csv_import import (
    CsvImportRead, CsvUploadResponse, CsvMapRequest,
    CsvValidationResponse, CsvImportResponse
)
from ..services.csv_parser import parse_upload, parse_date

router = APIRouter(prefix="/csv", tags=["csv"])
logger = logging.getLogger(__name__)

MAX_CSV_SIZE = 5 * 1024 * 1024  # 5MB


@router.get("/imports", response_model=List[CsvImportRead])
def list_imports(session: Session = Depends(get_session)):
    return session.exec(select(CsvImport).order_by(CsvImport.created_at.desc())).all()


@router.post("/upload", response_model=CsvUploadResponse, status_code=201)
async def upload_csv(file: UploadFile = File(...), session: Session = Depends(get_session)):
    filename = file.filename or "upload.csv"
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=415, detail="File must be a CSV")
    content = await file.read()
    if len(content) > MAX_CSV_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5MB)")
    parsed = parse_upload(content, filename)
    csv_import = CsvImport(filename=filename, total_rows=parsed["total_rows"], status="pending")
    # Store all rows as JSON for later import
    csv_import.rows_json = json.dumps(parsed["all_rows"])
    session.add(csv_import)
    session.commit()
    session.refresh(csv_import)
    return CsvUploadResponse(
        import_id=csv_import.id,
        headers=parsed["headers"],
        preview=parsed["preview"],
        total_rows=parsed["total_rows"],
    )


@router.post("/{import_id}/map-columns", response_model=CsvValidationResponse)
def map_columns(import_id: int, body: CsvMapRequest, session: Session = Depends(get_session)):
    csv_import = session.get(CsvImport, import_id)
    if not csv_import:
        raise HTTPException(status_code=404, detail="Import not found")
    if body.target not in ("income", "expense"):
        raise HTTPException(status_code=422, detail="target must be 'income' or 'expense'")
    rows = json.loads(csv_import.rows_json or "[]")
    valid = 0
    invalid = 0
    errors = []
    for i, row in enumerate(rows):
        row_errors = []
        date_col = body.mapping.get("date")
        amount_col = body.mapping.get("amount")
        if date_col and row.get(date_col):
            if not parse_date(str(row[date_col])):
                row_errors.append(f"Invalid date: {row[date_col]}")
        elif date_col:
            row_errors.append("Missing date value")
        if amount_col and row.get(amount_col):
            try:
                float(str(row[amount_col]).replace(",", "").replace("$", ""))
            except ValueError:
                row_errors.append(f"Invalid amount: {row[amount_col]}")
        elif amount_col:
            row_errors.append("Missing amount value")
        if row_errors:
            invalid += 1
            errors.append({"row": i + 1, "reason": "; ".join(row_errors)})
        else:
            valid += 1
    csv_import.mapping_json = json.dumps(body.mapping)
    csv_import.target = body.target
    csv_import.status = "mapped"
    session.add(csv_import)
    session.commit()
    return CsvValidationResponse(valid_rows=valid, invalid_rows=invalid, errors=errors)


@router.post("/{import_id}/import", response_model=CsvImportResponse)
def import_csv(import_id: int, session: Session = Depends(get_session)):
    csv_import = session.get(CsvImport, import_id)
    if not csv_import:
        raise HTTPException(status_code=404, detail="Import not found")
    if csv_import.status != "mapped":
        raise HTTPException(status_code=409, detail="Import must be in 'mapped' status first")
    rows = json.loads(csv_import.rows_json or "[]")
    mapping = json.loads(csv_import.mapping_json or "{}")
    target = csv_import.target
    imported = 0
    skipped = 0
    errors = []

    # Get first account for default
    default_account = session.exec(select(Account)).first()
    account_id = default_account.id if default_account else None
    if not account_id:
        raise HTTPException(status_code=422, detail="No accounts exist — create an account first")

    for i, row in enumerate(rows):
        try:
            date_col = mapping.get("date")
            amount_col = mapping.get("amount")
            desc_col = mapping.get("description")
            cat_col = mapping.get("category")

            row_date = parse_date(str(row.get(date_col, ""))) if date_col else None
            if not row_date:
                skipped += 1
                errors.append({"row": i + 1, "reason": "Invalid or missing date"})
                continue

            amount_str = str(row.get(amount_col, "0")).replace(",", "").replace("$", "").strip()
            try:
                from decimal import Decimal
                amount = abs(Decimal(amount_str))
            except Exception:
                skipped += 1
                errors.append({"row": i + 1, "reason": f"Invalid amount: {amount_str}"})
                continue

            description = str(row.get(desc_col, "")) if desc_col else ""
            category_name = str(row.get(cat_col, "Other")) if cat_col else "Other"

            # Auto-create category if needed
            cat = session.exec(select(Category).where(Category.name == category_name)).first()
            if not cat:
                cat = Category(name=category_name, icon="label", color="#5f5e5e")
                session.add(cat)
                session.flush()

            if target == "income":
                record = Income(
                    amount=amount, date=row_date, description=description,
                    account_id=account_id, type="import", source=category_name,
                )
                account = session.get(Account, account_id)
                if account:
                    account.balance += amount
                    session.add(account)
            else:
                record = Expense(
                    amount=amount, date=row_date, description=description,
                    account_id=account_id, category_id=cat.id, expense_type="variable",
                )
                account = session.get(Account, account_id)
                if account:
                    account.balance -= amount
                    session.add(account)

            session.add(record)
            imported += 1
        except Exception as e:
            skipped += 1
            errors.append({"row": i + 1, "reason": str(e)})

    csv_import.status = "imported"
    csv_import.imported_rows = imported
    session.add(csv_import)
    session.commit()
    return CsvImportResponse(imported=imported, skipped=skipped, errors=errors)
