from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import RequestUser, require_permissions
from app.core.rbac import PERMISSION_FINANCE_DASHBOARD, PERMISSION_FINANCE_MANAGE
from app.db.session import get_db
from app.schemas.admin import FinancialHoldCreateRequest, InvoiceCreateRequest, PaymentCreateRequest
from app.services.admin import get_admin_finance_overview, get_admin_reference_data
from app.services.admin_phase3 import (
    create_admin_financial_hold,
    create_admin_invoice,
    create_admin_payment,
    release_admin_financial_hold,
)


router = APIRouter(prefix="/finance", tags=["finance"])


@router.get("/dashboard", summary="Get the finance dashboard")
def dashboard(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_FINANCE_DASHBOARD)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_finance_overview(db)


@router.get("/overview", summary="Get finance management overview data")
def overview(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_FINANCE_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_finance_overview(db)


@router.get("/reference-data", summary="Get finance reference data")
def reference_data(
    current_user: RequestUser = Depends(require_permissions(PERMISSION_FINANCE_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return get_admin_reference_data(db)


@router.post("/invoices", summary="Issue a new student invoice")
def create_invoice(
    payload: InvoiceCreateRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_FINANCE_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return create_admin_invoice(db, current_user.id, payload)


@router.post("/payments", summary="Record a student payment")
def create_payment(
    payload: PaymentCreateRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_FINANCE_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return create_admin_payment(db, current_user.id, payload)


@router.post("/holds", summary="Place a financial hold on a student account")
def create_hold(
    payload: FinancialHoldCreateRequest,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_FINANCE_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return create_admin_financial_hold(db, current_user.id, payload)


@router.put("/holds/{hold_id}/release", summary="Release a financial hold")
def release_hold(
    hold_id: int,
    current_user: RequestUser = Depends(require_permissions(PERMISSION_FINANCE_MANAGE)),
    db: Session = Depends(get_db),
) -> dict:
    return release_admin_financial_hold(db, current_user.id, hold_id)
