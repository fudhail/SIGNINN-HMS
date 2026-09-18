from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Tenant, Property, TenantMembership, PropertyAccess, Role
from backend.security import verify_password, create_access_token
from backend.dependencies import get_current_user, get_auth_context, AuthContext

router = APIRouter(prefix="/api/auth", tags=["Authentication & Identity"])


class LoginRequest(BaseModel):
    email: str
    password: str


class PropertySummary(BaseModel):
    id: str
    name: str
    code: str
    city: str


class TenantSummary(BaseModel):
    id: str
    name: str
    subdomain: str
    status: str
    plan: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
    is_platform_user: bool
    platform_role: Optional[str] = None
    tenant: Optional[TenantSummary] = None
    role: Optional[Dict[str, Any]] = None
    permitted_properties: List[PropertySummary] = []
    permissions: List[str] = []


class DemoAccount(BaseModel):
    id: str
    name: str
    email: str
    role: str
    password: str
    badge: str
    description: str


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    if user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {user.status}. Please contact system administration.",
        )

    # Issue JWT
    token_payload = {
        "sub": user.id,
        "email": user.email,
        "name": user.name,
        "is_platform_user": user.is_platform_user,
    }
    access_token = create_access_token(token_payload)

    user_info = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "avatarUrl": user.avatar_url,
    }

    if user.is_platform_user:
        return LoginResponse(
            access_token=access_token,
            user=user_info,
            is_platform_user=True,
            platform_role=user.platform_role or "SIGNINN Super Admin",
            tenant=None,
            role={"code": "PLATFORM_ADMIN", "name": user.platform_role or "SIGNINN Super Admin"},
            permitted_properties=[],
            permissions=["*"],
        )

    # Hotel user - resolve memberships
    memberships = db.query(TenantMembership).filter(
        TenantMembership.user_id == user.id,
        TenantMembership.status == "Active",
    ).all()

    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not have any active hotel organization memberships.",
        )

    membership = memberships[0]
    tenant = db.query(Tenant).filter(Tenant.id == membership.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant organization not found.")
    if tenant.status == "Suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Hotel Organization Suspended: {tenant.suspended_reason or 'Please contact billing.'}",
        )

    role = db.query(Role).filter(Role.id == membership.role_id).first()
    permissions = [p.code for p in role.permissions] if role else []

    # Permitted properties
    if role and role.code == "OWNER":
        all_props = db.query(Property).filter(Property.tenant_id == tenant.id).all()
        prop_summaries = [
            PropertySummary(id=p.id, name=p.name, code=p.code, city=p.city)
            for p in all_props
        ]
    else:
        accesses = db.query(PropertyAccess).filter(
            PropertyAccess.membership_id == membership.id
        ).all()
        prop_ids = [pa.property_id for pa in accesses]
        props = db.query(Property).filter(Property.id.in_(prop_ids)).all() if prop_ids else []
        prop_summaries = [
            PropertySummary(id=p.id, name=p.name, code=p.code, city=p.city)
            for p in props
        ]

    return LoginResponse(
        access_token=access_token,
        user=user_info,
        is_platform_user=False,
        platform_role=None,
        tenant=TenantSummary(
            id=tenant.id,
            name=tenant.name,
            subdomain=tenant.subdomain,
            status=tenant.status,
            plan=tenant.plan,
        ),
        role={"id": role.id, "code": role.code, "name": role.name} if role else None,
        permitted_properties=prop_summaries,
        permissions=permissions,
    )


@router.get("/me", response_model=LoginResponse)
def get_current_user_profile(
    user: User = Depends(get_current_user),
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    token_payload = {
        "sub": user.id,
        "email": user.email,
        "name": user.name,
        "is_platform_user": user.is_platform_user,
    }
    access_token = create_access_token(token_payload)

    user_info = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "avatarUrl": user.avatar_url,
    }

    if user.is_platform_user:
        return LoginResponse(
            access_token=access_token,
            user=user_info,
            is_platform_user=True,
            platform_role=user.platform_role or "SIGNINN Super Admin",
            tenant=None,
            role={"code": "PLATFORM_ADMIN", "name": user.platform_role or "SIGNINN Super Admin"},
            permitted_properties=[],
            permissions=["*"],
        )

    tenant = db.query(Tenant).filter(Tenant.id == auth.tenant_id).first() if auth.tenant_id else None
    role = None
    if auth.role_code:
        role = {"code": auth.role_code, "name": auth.role_name}

    prop_summaries = []
    if auth.allowed_property_ids:
        props = db.query(Property).filter(Property.id.in_(auth.allowed_property_ids)).all()
        prop_summaries = [
            PropertySummary(id=p.id, name=p.name, code=p.code, city=p.city)
            for p in props
        ]

    return LoginResponse(
        access_token=access_token,
        user=user_info,
        is_platform_user=False,
        platform_role=None,
        tenant=TenantSummary(
            id=tenant.id,
            name=tenant.name,
            subdomain=tenant.subdomain,
            status=tenant.status,
            plan=tenant.plan,
        ) if tenant else None,
        role=role,
        permitted_properties=prop_summaries,
        permissions=auth.permissions,
    )


@router.get("/demo-accounts", response_model=List[DemoAccount])
def get_demo_accounts():
    return [
        DemoAccount(
            id="usr-superadmin",
            name="Vikramaditya Roy (Platform)",
            email="superadmin@signinn.com",
            role="SIGNINN Super Admin",
            password="password123",
            badge="Platform HQ",
            description="Manages all hotel clients, SaaS subscriptions, platform health & provisioning.",
        ),
        DemoAccount(
            id="usr-owner",
            name="Alex Morgan (Owner)",
            email="alex.morgan@grandazure.com",
            role="Owner",
            password="password123",
            badge="Portfolio Admin",
            description="Tenant-wide executive with portfolio analytics, staff oversight, and financial controls.",
        ),
        DemoAccount(
            id="usr-gm",
            name="Rohit Verma (Property Manager)",
            email="rohit.gm@grandazure.com",
            role="Property Manager",
            password="password123",
            badge="Hotel Operations",
            description="Day-to-day property operational oversight across rooms, front desk, and staff.",
        ),
        DemoAccount(
            id="usr-frontdesk",
            name="Priya Sharma (Front Desk)",
            email="priya.desk@grandazure.com",
            role="Front Desk",
            password="password123",
            badge="Front Office",
            description="Tape Chart, reservations, arrivals/departures, check-in, check-out, folio viewing.",
        ),
        DemoAccount(
            id="usr-nightaudit",
            name="Kiran Patel (Night Auditor)",
            email="kiran.audit@grandazure.com",
            role="Night Auditor",
            password="password123",
            badge="Night Audit",
            description="End-of-day room charge posting, daily balance reconciliation, business-date close.",
        ),
        DemoAccount(
            id="usr-housekeeping",
            name="Sunita Devi (Housekeeping)",
            email="sunita.clean@grandazure.com",
            role="Housekeeping",
            password="password123",
            badge="Housekeeping",
            description="Focused room turnover board, cleaning status updates, inspection checklist.",
        ),
        DemoAccount(
            id="usr-maintenance",
            name="Rajesh Kumar (Maintenance)",
            email="rajesh.fix@grandazure.com",
            role="Maintenance",
            password="password123",
            badge="Engineering",
            description="Equipment and room repair tickets, emergency workorders, Out-of-Order tracking.",
        ),
        DemoAccount(
            id="usr-revenue",
            name="Kavita Nair (Revenue Manager)",
            email="kavita.rev@grandazure.com",
            role="Revenue Manager",
            password="password123",
            badge="Revenue & Yield",
            description="Rate plans, BAR multipliers, inventory distribution, OTA channel management.",
        ),
        DemoAccount(
            id="usr-finance",
            name="Arun Menon (Finance)",
            email="arun.finance@grandazure.com",
            role="Finance",
            password="password123",
            badge="Finance & Folios",
            description="Folios, payments, refunds, invoices, GST settlement, and financial reporting.",
        ),
    ]
