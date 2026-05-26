from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from src.config.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.finance import FinanceFacultyScope, Invoice, Payment, Hold
from src.models.department import Department
from src.models.program import Program
from src.schemas.finance import InvoiceOut, InvoiceCreate, PaymentOut, PaymentCreate, HoldOut, HoldCreate
from src.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/finance", tags=["Finance"])


def _finance_faculty_ids(user: User, db: Session) -> set[int] | None:
    if user.role == "system_admin":
        return None
    rows = db.query(FinanceFacultyScope).filter(FinanceFacultyScope.user_id == user.id).all()
    if any(row.scope == "university" for row in rows):
        return None
    return {row.faculty_id for row in rows}


def _invoice_scope_query(q, current_user: User, db: Session):
    faculty_ids = _finance_faculty_ids(current_user, db)
    if faculty_ids is None:
        return q
    if not faculty_ids:
        return q.filter(False)
    return q.join(Student, Student.id == Invoice.student_id).join(Program, Program.id == Student.program_id).join(Department, Department.id == Program.department_id).filter(Department.faculty_id.in_(faculty_ids))

@router.get("/invoices/me", response_model=List[InvoiceOut])
def my_invoices(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return db.query(Invoice).filter(Invoice.student_id == student.id).all()

@router.get("/invoices", response_model=List[InvoiceOut])
def list_invoices(student_id: Optional[int] = None, status: Optional[str] = None, current_user: User = Depends(require_roles("finance_staff", "system_admin")), db: Session = Depends(get_db)):
    q = db.query(Invoice)
    q = _invoice_scope_query(q, current_user, db)
    if student_id:
        q = q.filter(Invoice.student_id == student_id)
    if status:
        q = q.filter(Invoice.status == status)
    return q.all()

@router.post("/invoices", response_model=InvoiceOut, status_code=201)
def create_invoice(body: InvoiceCreate, current_user: User = Depends(require_roles("finance_staff", "system_admin")), db: Session = Depends(get_db)):
    allowed = _finance_faculty_ids(current_user, db)
    if allowed is not None:
        student = db.query(Student).filter(Student.id == body.student_id).first()
        faculty_id = student.program.department.faculty_id if student and student.program and student.program.department else None
        if faculty_id not in allowed:
            raise HTTPException(status_code=403, detail="Finance staff can manage only assigned faculties")
    invoice = Invoice(**body.model_dump())
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/payments", response_model=List[PaymentOut])
def list_payments(invoice_id: Optional[int] = None, current_user: User = Depends(require_roles("finance_staff", "system_admin")), db: Session = Depends(get_db)):
    q = db.query(Payment).join(Invoice, Invoice.id == Payment.invoice_id)
    q = _invoice_scope_query(q, current_user, db)
    if invoice_id:
        q = q.filter(Payment.invoice_id == invoice_id)
    return q.all()

@router.post("/payments", response_model=PaymentOut, status_code=201)
def record_payment(body: PaymentCreate, current_user: User = Depends(require_roles("finance_staff", "system_admin")), db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == body.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    payment = Payment(invoice_id=body.invoice_id, recorded_by=current_user.id, amount=body.amount, method=body.method, reference=body.reference)
    db.add(payment)
    invoice.amount_paid = float(invoice.amount_paid) + float(body.amount)
    if float(invoice.amount_paid) >= float(invoice.amount):
        invoice.amount_paid = invoice.amount
        invoice.status = "paid"
    elif float(invoice.amount_paid) > 0:
        invoice.status = "partial"
    db.commit()
    db.refresh(payment)
    return payment

@router.get("/holds", response_model=List[HoldOut])
def list_holds(student_id: Optional[int] = None, active_only: bool = True, current_user: User = Depends(require_roles("finance_staff", "system_admin", "academic_staff")), db: Session = Depends(get_db)):
    q = db.query(Hold)
    faculty_ids = _finance_faculty_ids(current_user, db) if current_user.role == "finance_staff" else None
    if faculty_ids is not None:
        if not faculty_ids:
            q = q.filter(False)
        else:
            q = q.join(Student, Student.id == Hold.student_id).join(Program, Program.id == Student.program_id).join(Department, Department.id == Program.department_id).filter(Department.faculty_id.in_(faculty_ids))
    if student_id:
        q = q.filter(Hold.student_id == student_id)
    if active_only:
        q = q.filter(Hold.is_active == True)
    return q.all()

@router.post("/holds", response_model=HoldOut, status_code=201)
def create_hold(body: HoldCreate, current_user: User = Depends(require_roles("finance_staff", "system_admin")), db: Session = Depends(get_db)):
    allowed = _finance_faculty_ids(current_user, db)
    if allowed is not None:
        student = db.query(Student).filter(Student.id == body.student_id).first()
        faculty_id = student.program.department.faculty_id if student and student.program and student.program.department else None
        if faculty_id not in allowed:
            raise HTTPException(status_code=403, detail="Finance staff can manage only assigned faculties")
    hold = Hold(**body.model_dump(), created_by=current_user.id)
    db.add(hold)
    db.commit()
    db.refresh(hold)
    return hold

@router.put("/holds/{hold_id}/resolve", response_model=HoldOut)
def resolve_hold(hold_id: int, current_user: User = Depends(require_roles("finance_staff", "system_admin")), db: Session = Depends(get_db)):
    hold = db.query(Hold).filter(Hold.id == hold_id, Hold.is_active == True).first()
    if not hold:
        raise HTTPException(status_code=404, detail="Active hold not found")
    hold.is_active = False
    hold.resolved_by = current_user.id
    hold.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(hold)
    return hold
