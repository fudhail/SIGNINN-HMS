from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_auth_context, require_permission, get_current_tenant_id, AuthContext
from backend.models import Property, Tenant, generate_id
from backend.schemas import PropertyResponse, PropertyBase, PropertyCreate

router = APIRouter(prefix="/api/properties", tags=["Properties"])


@router.get("", response_model=List[PropertyResponse])
def get_properties(
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    query = db.query(Property).filter(Property.tenant_id == auth.tenant_id)
    if not auth.is_platform_user and auth.allowed_property_ids:
        query = query.filter(Property.id.in_(auth.allowed_property_ids))
    return query.all()


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(
    property_id: str,
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    if not auth.is_platform_user and auth.allowed_property_ids and property_id not in auth.allowed_property_ids:
        raise HTTPException(status_code=403, detail=f"Access denied: You do not have access to property '{property_id}'.")
    prop = db.query(Property).filter(
        Property.id == property_id,
        Property.tenant_id == auth.tenant_id,
    ).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    prop_in: PropertyCreate,
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == auth.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant organization not found")

    # Check multi-property entitlement if client already has at least 1 property
    existing_count = db.query(Property).filter(Property.tenant_id == tenant.id).count()
    has_multi_property = bool(tenant.features and tenant.features.get("multiProperty"))
    if existing_count >= 1 and not has_multi_property:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Multi-property feature is not enabled for this client account. Upgrade to Enterprise or enable the Multi-Property Add-on.",
        )

    new_prop = Property(
        id=generate_id("prop"),
        tenant_id=tenant.id,
        name=prop_in.name,
        code=prop_in.code,
        city=prop_in.city,
        state=prop_in.state,
        address=prop_in.address,
        phone=prop_in.phone,
        email=prop_in.email,
        currency=prop_in.currency,
        timezone=prop_in.timezone,
        total_rooms=prop_in.total_rooms,
        rating=prop_in.rating,
        gstin=prop_in.gstin,
    )
    db.add(new_prop)
    db.commit()
    db.refresh(new_prop)
    return new_prop


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: str,
    prop_in: PropertyBase,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(
        Property.id == property_id,
        Property.tenant_id == tenant_id,
    ).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    for key, value in prop_in.dict(exclude_unset=True).items():
        setattr(prop, key, value)
    db.commit()
    db.refresh(prop)
    return prop
