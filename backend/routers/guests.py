from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_current_tenant_id
from backend.models import Guest, generate_id
from backend.schemas import GuestResponse, GuestBase

router = APIRouter(prefix="/api/guests", tags=["Guests (CRM)"])


@router.get("", response_model=List[GuestResponse])
def get_guests(
    search: Optional[str] = None,
    vip_only: Optional[bool] = False,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    query = db.query(Guest).filter(Guest.tenant_id == tenant_id)
    if vip_only:
        query = query.filter(Guest.vip_status == True)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Guest.first_name.ilike(s))
            | (Guest.last_name.ilike(s))
            | (Guest.email.ilike(s))
            | (Guest.phone.ilike(s))
        )
    return query.order_by(Guest.first_name).all()


@router.get("/{guest_id}", response_model=GuestResponse)
def get_guest(
    guest_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    guest = db.query(Guest).filter(Guest.id == guest_id, Guest.tenant_id == tenant_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    return guest


@router.post("", response_model=GuestResponse, status_code=status.HTTP_201_CREATED)
def create_guest(
    guest_in: GuestBase,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    new_id = generate_id("gst")
    guest = Guest(
        id=new_id,
        tenant_id=tenant_id,
        first_name=guest_in.first_name,
        last_name=guest_in.last_name,
        email=guest_in.email,
        phone=guest_in.phone,
        id_type=guest_in.id_type,
        id_number=guest_in.id_number,
        nationality=guest_in.nationality,
        vip_status=guest_in.vip_status,
        preferences=guest_in.preferences,
        notes=guest_in.notes,
        address=guest_in.address,
        city=guest_in.city,
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest


@router.put("/{guest_id}", response_model=GuestResponse)
def update_guest(
    guest_id: str,
    guest_in: GuestBase,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    guest = db.query(Guest).filter(Guest.id == guest_id, Guest.tenant_id == tenant_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    for key, val in guest_in.dict(exclude_unset=True).items():
        setattr(guest, key, val)
    db.commit()
    db.refresh(guest)
    return guest
