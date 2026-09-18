from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_current_tenant_id
from backend.models import AuditLog, StaffMember, generate_id
from backend.schemas import AuditLogResponse, StaffMemberResponse

router = APIRouter(prefix="/api/staff-audit", tags=["Staff Management & Audit Trail"])


@router.get("/staff", response_model=List[StaffMemberResponse])
def get_staff_members(
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    return db.query(StaffMember).filter(StaffMember.tenant_id == tenant_id).all()


@router.post("/staff", response_model=StaffMemberResponse, status_code=status.HTTP_201_CREATED)
def add_staff_member(
    payload: Dict[str, str],
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    new_id = generate_id("stf")
    staff = StaffMember(
        id=new_id,
        tenant_id=tenant_id,
        property_id=payload.get("propertyId", "prop-1"),
        name=payload.get("name", "New Staff"),
        email=payload.get("email", "staff@hotel.com"),
        phone=payload.get("phone", "+91 90000 00000"),
        role=payload.get("role", "Front Desk"),
        status="Active",
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


@router.patch("/staff/{staff_id}/status")
def update_staff_status(
    staff_id: str,
    payload: Dict[str, str],
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    staff = db.query(StaffMember).filter(
        StaffMember.id == staff_id,
        StaffMember.tenant_id == tenant_id,
    ).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    new_status = payload.get("status")
    if new_status:
        staff.status = new_status
        db.commit()

    return {"message": "Staff status updated", "status": new_status}


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    return db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id).order_by(AuditLog.timestamp.desc()).all()
