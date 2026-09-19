from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import require_permission, AuthContext
from backend.models import Folio, FolioItem, Payment, Invoice, Reservation, generate_id
from backend.schemas import (
    FolioResponse,
    PaymentResponse,
    AddChargeRequest,
    RecordPaymentRequest,
)

router = APIRouter(prefix="/api/billing", tags=["Billing, Folios & Payments"])


@router.get("/folios", response_model=List[FolioResponse])
def get_folios(
    status: Optional[str] = None,
    auth: AuthContext = Depends(require_permission("folio.view")),
    db: Session = Depends(get_db),
):
    query = db.query(Folio).filter(Folio.tenant_id == auth.tenant_id)
    if status:
        query = query.filter(Folio.status == status)
    return query.all()


@router.get("/folios/{folio_id}", response_model=FolioResponse)
def get_folio(
    folio_id: str,
    auth: AuthContext = Depends(require_permission("folio.view")),
    db: Session = Depends(get_db),
):
    folio = db.query(Folio).filter(Folio.id == folio_id, Folio.tenant_id == auth.tenant_id).first()
    if not folio:
        raise HTTPException(status_code=404, detail="Folio not found")
    return folio


@router.post("/folios/{folio_id}/charges")
def add_charge_to_folio(
    folio_id: str,
    req: AddChargeRequest,
    auth: AuthContext = Depends(require_permission("folio.charge")),
    db: Session = Depends(get_db),
):
    folio = db.query(Folio).filter(Folio.id == folio_id, Folio.tenant_id == auth.tenant_id).first()
    if not folio:
        raise HTTPException(status_code=404, detail="Folio not found")

    item = FolioItem(
        id=generate_id("fi"),
        tenant_id=auth.tenant_id,
        folio_id=folio.id,
        description=req.description,
        category=req.category,
        amount=req.amount,
        type="Charge",
        added_by=req.added_by,
    )
    db.add(item)
    folio.total_charges += req.amount
    folio.balance = max(0.0, folio.total_charges - folio.total_payments)
    db.commit()
    return {"message": "Charge added to folio", "folioId": folio.id, "balance": folio.balance}


@router.post("/folios/{folio_id}/payments")
def record_folio_payment(
    folio_id: str,
    req: RecordPaymentRequest,
    auth: AuthContext = Depends(require_permission("payment.collect")),
    db: Session = Depends(get_db),
):
    folio = db.query(Folio).filter(Folio.id == folio_id, Folio.tenant_id == auth.tenant_id).first()
    if not folio:
        raise HTTPException(status_code=404, detail="Folio not found")

    item = FolioItem(
        id=generate_id("fi"),
        tenant_id=auth.tenant_id,
        folio_id=folio.id,
        description=f"Payment received ({req.method})",
        category="Misc",
        amount=req.amount,
        type="Payment",
        payment_method=req.method,
        reference=req.reference or f"PAY-{int(datetime.utcnow().timestamp())}",
        added_by=auth.user_name,
    )
    db.add(item)
    folio.total_payments += req.amount
    folio.balance = max(0.0, folio.total_charges - folio.total_payments)
    if folio.balance <= 0:
        folio.status = "Settled"

    # Also log to global payments table
    db.add(Payment(
        id=generate_id("pay"),
        tenant_id=auth.tenant_id,
        reservation_id=folio.reservation_id,
        reservation_ref=folio.reservation_ref,
        guest_name=folio.guest_name,
        amount=req.amount,
        currency="INR",
        method=req.method,
        status="Success",
        date=datetime.utcnow().isoformat(),
        reference=item.reference,
        notes=req.notes or "",
    ))

    # Update reservation paid status
    res = db.query(Reservation).filter(Reservation.id == folio.reservation_id).first()
    if res:
        res.paid_amount += req.amount
        res.balance_amount = max(0.0, res.total_amount - res.paid_amount)
        res.payment_status = "Paid" if res.balance_amount == 0 else "Partially Paid"

    db.commit()
    return {"message": "Payment recorded", "balance": folio.balance, "status": folio.status}


@router.get("/payments", response_model=List[PaymentResponse])
def get_payments(
    auth: AuthContext = Depends(require_permission("payment.view")),
    db: Session = Depends(get_db),
):
    return db.query(Payment).filter(Payment.tenant_id == auth.tenant_id).order_by(Payment.date.desc()).all()


@router.post("/payments", status_code=status.HTTP_201_CREATED)
def record_direct_payment(
    req: RecordPaymentRequest,
    auth: AuthContext = Depends(require_permission("payment.collect")),
    db: Session = Depends(get_db),
):
    pay_id = generate_id("pay")
    payment = Payment(
        id=pay_id,
        tenant_id=auth.tenant_id,
        reservation_id=None,
        reservation_ref=None,
        guest_name="Front Desk Customer",
        amount=req.amount,
        currency="INR",
        method=req.method,
        status="Success",
        date=datetime.utcnow().isoformat(),
        reference=req.reference or f"DIR-{int(datetime.utcnow().timestamp())}",
        notes=req.notes or "Front Desk Direct Settlement",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {
        "id": payment.id,
        "amount": payment.amount,
        "method": payment.method,
        "status": payment.status,
        "date": payment.date,
        "reference": payment.reference,
        "guestName": payment.guest_name,
    }


@router.get("/invoices")
def get_invoices(
    auth: AuthContext = Depends(require_permission("folio.view")),
    db: Session = Depends(get_db),
):
    return db.query(Invoice).filter(Invoice.tenant_id == auth.tenant_id).all()


@router.post("/invoices", status_code=status.HTTP_201_CREATED)
def create_invoice(
    payload: dict,
    auth: AuthContext = Depends(require_permission("folio.view")),
    db: Session = Depends(get_db),
):
    import random
    inv_id = generate_id("inv")
    inv_num = f"INV-2026-{random.randint(10000, 99999)}"
    inv = Invoice(
        id=inv_id,
        tenant_id=auth.tenant_id,
        invoice_number=inv_num,
        reservation_id=payload.get("reservationId"),
        guest_name=payload.get("guestName", "Guest"),
        room_number=payload.get("roomNumber", ""),
        amount=float(payload.get("amount", 0.0)),
        tax_amount=float(payload.get("taxAmount", float(payload.get("amount", 0.0)) * 0.12)),
        status=payload.get("status", "Paid"),
        issued_at=datetime.utcnow().isoformat(),
        due_date=payload.get("dueDate", datetime.utcnow().isoformat()[:10]),
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv
