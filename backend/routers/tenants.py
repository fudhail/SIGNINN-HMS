import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_auth_context, require_platform_user, AuthContext
from backend.models import Tenant, Property, Room, generate_id
from backend.schemas import TenantCreate, TenantUpdate, TenantResponse

router = APIRouter(prefix="/api/tenants", tags=["Tenants (Multi-Tenant SaaS)"])


@router.get("", response_model=List[TenantResponse])
def get_all_tenants(
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    if auth.is_platform_user:
        tenants = db.query(Tenant).all()
    else:
        tenants = db.query(Tenant).filter(Tenant.id == auth.tenant_id).all()

    # Compute active rooms & property count
    for t in tenants:
        t.properties_count = db.query(Property).filter(Property.tenant_id == t.id).count()
        t.total_rooms_active = db.query(Room).filter(Room.tenant_id == t.id).count()
    return tenants


@router.get("/platform/metrics")
def get_platform_metrics(
    auth: AuthContext = Depends(require_platform_user),
    db: Session = Depends(get_db),
):
    tenants = db.query(Tenant).all()
    total_tenants = len(tenants)
    active_tenants = sum(1 for t in tenants if t.status == "Active")
    total_rooms = db.query(Room).count()
    total_mrr = sum(t.mrr for t in tenants if t.status == "Active")
    total_gmv = sum(t.monthly_gmv for t in tenants)

    return {
        "totalTenants": total_tenants,
        "activeTenants": active_tenants,
        "totalRoomsManaged": total_rooms,
        "monthlyRecurringRevenue": total_mrr,
        "annualRecurringRevenue": total_mrr * 12,
        "totalGmvProcessed": total_gmv,
        "otaSyncSuccessRate": 99.8,
        "activeApiSessions": 42,
    }


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(
    tenant_id: str,
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    if not auth.is_platform_user and auth.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to tenant organization.")
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.properties_count = db.query(Property).filter(Property.tenant_id == tenant.id).count()
    tenant.total_rooms_active = db.query(Room).filter(Room.tenant_id == tenant.id).count()
    return tenant


def calculate_tenant_mrr(plan: str, features: Dict[str, Any]) -> float:
    base_prices = {
        "Starter": 4499.0,
        "Professional": 8999.0,
        "Enterprise": 19999.0,
    }
    mrr = base_prices.get(plan, 4499.0)
    if plan != "Enterprise":
        if features.get("multiProperty"):
            mrr += 4999.0
        if features.get("qrRoomService"):
            mrr += 1499.0
        if features.get("whatsappAutomations"):
            mrr += 2499.0
        if features.get("aiPricing"):
            mrr += 3499.0
        if features.get("smsGuestPortal"):
            mrr += 999.0
        if features.get("housekeepingApp") and plan == "Starter":
            mrr += 999.0
    return mrr


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
def provision_tenant(
    tenant_in: TenantCreate,
    auth: AuthContext = Depends(require_platform_user),
    db: Session = Depends(get_db),
):
    new_id = generate_id("tenant")
    # Default features based on plan
    if tenant_in.plan == "Enterprise":
        default_features = {
            "otaChannelManager": True,
            "directBookingEngine": True,
            "whatsappAutomations": True,
            "multiProperty": True,
            "advancedAnalytics": True,
            "qrRoomService": True,
            "aiPricing": True,
            "housekeepingApp": True,
            "smsGuestPortal": True,
        }
    elif tenant_in.plan == "Professional":
        default_features = {
            "otaChannelManager": True,
            "directBookingEngine": True,
            "whatsappAutomations": False,
            "multiProperty": False,
            "advancedAnalytics": True,
            "qrRoomService": False,
            "aiPricing": False,
            "housekeepingApp": True,
            "smsGuestPortal": False,
        }
    else:  # Starter
        default_features = {
            "otaChannelManager": False,
            "directBookingEngine": True,
            "whatsappAutomations": False,
            "multiProperty": False,
            "advancedAnalytics": False,
            "qrRoomService": False,
            "aiPricing": False,
            "housekeepingApp": False,
            "smsGuestPortal": False,
        }
    merged_features = {**default_features, **tenant_in.features}

    calculated_mrr = tenant_in.mrr if tenant_in.mrr and tenant_in.mrr > 0 else calculate_tenant_mrr(tenant_in.plan, merged_features)

    tenant = Tenant(
        id=new_id,
        name=tenant_in.name,
        slug=tenant_in.slug,
        subdomain=tenant_in.subdomain,
        owner_name=tenant_in.owner_name,
        owner_email=tenant_in.owner_email,
        owner_phone=tenant_in.owner_phone,
        plan=tenant_in.plan,
        status="Active",
        billing_cycle=tenant_in.billing_cycle,
        mrr=calculated_mrr,
        max_rooms=tenant_in.max_rooms,
        primary_property_id=None,
        features=merged_features,
    )
    db.add(tenant)
    db.commit()

    # Automatically provision default property for this tenant
    prop_id = generate_id("prop")
    prop = Property(
        id=prop_id,
        tenant_id=new_id,
        name=f"{tenant_in.name} Main Hotel",
        code=f"{tenant_in.slug[:3].upper()}-01",
        city="Primary City",
        state="State",
        currency="INR",
        timezone="Asia/Kolkata",
        total_rooms=tenant_in.max_rooms,
    )
    db.add(prop)
    tenant.primary_property_id = prop_id
    db.commit()
    db.refresh(tenant)

    tenant.properties_count = 1
    tenant.total_rooms_active = 0
    return tenant


@router.patch("/{tenant_id}/status")
def update_tenant_status(
    tenant_id: str,
    payload: Dict[str, Any],
    auth: AuthContext = Depends(require_platform_user),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    new_status = payload.get("status")
    reason = payload.get("reason", "")
    if new_status:
        tenant.status = new_status
        if reason:
            tenant.suspended_reason = reason
        elif new_status == "Active":
            tenant.suspended_reason = None
        db.commit()
    return {"message": f"Tenant status updated to {new_status}", "status": new_status, "reason": tenant.suspended_reason}


@router.patch("/{tenant_id}/plan")
def update_tenant_plan(
    tenant_id: str,
    payload: Dict[str, str],
    auth: AuthContext = Depends(require_platform_user),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    new_plan = payload.get("plan")
    if new_plan:
        tenant.plan = new_plan
        features = dict(tenant.features or {})
        if new_plan == "Enterprise":
            features["multiProperty"] = True
            features["aiPricing"] = True
            features["whatsappAutomations"] = True
            features["qrRoomService"] = True
            features["otaChannelManager"] = True
        elif new_plan == "Starter":
            # If not purchased as separate add-on, defaults
            features["otaChannelManager"] = False
        tenant.features = features
        tenant.mrr = calculate_tenant_mrr(new_plan, features)
        db.commit()
    return {"message": f"Tenant plan updated to {new_plan}", "plan": new_plan, "mrr": tenant.mrr}


@router.patch("/{tenant_id}/features")
def update_tenant_features(
    tenant_id: str,
    payload: Dict[str, Any],
    auth: AuthContext = Depends(require_platform_user),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    features = payload.get("features", payload)
    current_features = dict(tenant.features or {})
    current_features.update(features)
    tenant.features = current_features
    tenant.mrr = calculate_tenant_mrr(tenant.plan, current_features)
    db.commit()
    return {"message": "Tenant features updated", "features": tenant.features, "mrr": tenant.mrr}


@router.patch("/{tenant_id}/deletion-toggle")
def toggle_deletion_permission(
    tenant_id: str,
    payload: Dict[str, bool],
    auth: AuthContext = Depends(require_platform_user),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    allow = payload.get("deletion_allowed", not tenant.deletion_allowed)
    tenant.deletion_allowed = allow
    db.commit()
    return {"message": f"Deletion permission set to {allow}", "deletion_allowed": tenant.deletion_allowed}


@router.post("/{tenant_id}/payments")
def record_tenant_payment(
    tenant_id: str,
    payment_in: Dict[str, Any],
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    from datetime import datetime
    today = datetime.utcnow().strftime("%Y-%m-%d")
    amount = float(payment_in.get("amount", 0.0))
    ref = payment_in.get("reference", f"TXN-{uuid.uuid4().hex[:6].upper()}")
    method = payment_in.get("method", "UPI")
    notes = payment_in.get("notes", "Subscription renewal payment")
    next_renewal = payment_in.get("next_renewal_date", "2027-01-01")

    payment_record = {
        "id": f"pay-{uuid.uuid4().hex[:8]}",
        "date": today,
        "amount": amount,
        "reference": ref,
        "method": method,
        "notes": notes,
        "status": "Paid",
    }

    history = list(tenant.payment_history or [])
    history.insert(0, payment_record)

    tenant.payment_history = history
    tenant.payment_status = "Paid"
    tenant.last_payment_date = today
    if next_renewal:
        tenant.renewal_date = next_renewal
    if tenant.status == "Past Due":
        tenant.status = "Active"

    db.commit()
    db.refresh(tenant)
    return {
        "message": "Payment recorded successfully",
        "payment_status": tenant.payment_status,
        "last_payment_date": tenant.last_payment_date,
        "renewal_date": tenant.renewal_date,
        "history": tenant.payment_history,
    }


@router.delete("/{tenant_id}")
def delete_tenant(
    tenant_id: str,
    force: bool = False,
    auth: AuthContext = Depends(require_platform_user),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if not tenant.deletion_allowed and not force:
        raise HTTPException(
            status_code=400,
            detail="Tenant deletion feature is disabled for this client. Enable 'Allow Deletion' toggle first."
        )
    db.delete(tenant)
    db.commit()
    return {"message": f"Tenant '{tenant.name}' ({tenant_id}) deleted successfully."}

