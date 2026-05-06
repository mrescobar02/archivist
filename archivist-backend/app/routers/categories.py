from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db.session import get_session
from ..models.category import Category
from ..models.expense import Expense
from ..models.fixed_expense import FixedExpense
from ..models.receipt_scan import ReceiptScan
from ..schemas.category import CategoryCreate, CategoryRead

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=List[CategoryRead])
def list_categories(session: Session = Depends(get_session)):
    return session.exec(select(Category).order_by(Category.name)).all()


@router.post("", response_model=CategoryRead, status_code=201)
def create_category(body: CategoryCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(Category).where(Category.name == body.name)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category name already exists")
    cat = Category(**body.model_dump())
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, session: Session = Depends(get_session)):
    cat = session.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    refs = [
        session.exec(select(Expense).where(Expense.category_id == category_id)).first(),
        session.exec(select(FixedExpense).where(FixedExpense.category_id == category_id)).first(),
        session.exec(select(ReceiptScan).where(ReceiptScan.category_id == category_id)).first(),
    ]
    if any(refs):
        raise HTTPException(status_code=409, detail="Category is in use")
    session.delete(cat)
    session.commit()
