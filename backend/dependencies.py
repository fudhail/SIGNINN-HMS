from typing import Optional, List
from pydantic import BaseModel
from fastapi import Header, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Tenant, Property, TenantMembership, PropertyAccess, Role, Permission
from backend.security import decode_access_token

security_bearer = HTTPBearer(auto_error=False)


class AuthContext(BaseModel):
    user_id: str
    user_email: str
    user_name: str
    is_platform_user: bool = False
    platform_role: Optional[str] = None
    tenant_id: Optional[str] = None
    property_id: Optional[str] = None
    membership_id: Optional[str] = None
    role_code: Optional[str] = None
    role_name: Optional[str] = None
    allowed_property_ids: List[str] = []
    permissions: List[str] = []

    class Config:
        arbitrary_types_allowed = True


def get_current_user_optional(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not auth_header or not auth_header.credentials:
        return None
    try:
        payload = decode_access_token(auth_header.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.status != "Active":
            return None
        return user
    except Exception:
        return None


def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_auth_context(
    user: Optional[User] = Depends(get_current_user_optional),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    x_property_id: Optional[str] = Header(None, alias="X-Property-ID"),
    db: Session = Depends(get_db),
) -> AuthContext:
    # 1. If user is authenticated via Bearer token:
    if user:
        if user.is_platform_user:
            return AuthContext(
                user_id=user.id,
                user_email=user.email,
                user_name=user.name,
                is_platform_user=True,
                platform_role=user.platform_role or "SIGNINN Super Admin",
                tenant_id=x_tenant_id,
                property_id=x_property_id,
                allowed_property_ids=[],
                permissions=["*"],  # Platform admin permissions
            )

        # Hotel user - resolve tenant membership
        memberships = db.query(TenantMembership).filter(
            TenantMembership.user_id == user.id,
            TenantMembership.status == "Active",
        ).all()

        if not memberships:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no active tenant memberships.",
            )

        # Match membership to requested X-Tenant-ID if specified, else take first
        selected_membership = None
        if x_tenant_id:
            selected_membership = next((m for m in memberships if m.tenant_id == x_tenant_id), None)
            if not selected_membership:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied: You are not a member of tenant '{x_tenant_id}'.",
                )
        else:
            selected_membership = memberships[0]

        tenant = db.query(Tenant).filter(Tenant.id == selected_membership.tenant_id).first()
        if not tenant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant organization not found.")
        if tenant.status == "Suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Tenant Account Suspended: {tenant.suspended_reason or 'Please contact SIGNINN Support.'}",
            )

        # Resolve role & permissions
        role = db.query(Role).filter(Role.id == selected_membership.role_id).first()
        permissions = [p.code for p in role.permissions] if role else []

        # Resolve allowed properties
        if role and role.code == "OWNER":
            # Tenant Owner has access to all properties in the tenant
            all_props = db.query(Property).filter(Property.tenant_id == tenant.id).all()
            allowed_property_ids = [p.id for p in all_props]
        else:
            # Property-scoped access
            accesses = db.query(PropertyAccess).filter(
                PropertyAccess.membership_id == selected_membership.id
            ).all()
            allowed_property_ids = [pa.property_id for pa in accesses]

        # If X-Property-ID is requested, validate that user has access to it
        if x_property_id and x_property_id not in allowed_property_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You do not have access to property '{x_property_id}'.",
            )

        resolved_prop_id = x_property_id or (allowed_property_ids[0] if allowed_property_ids else None)
        return AuthContext(
            user_id=user.id,
            user_email=user.email,
            user_name=user.name,
            is_platform_user=False,
            tenant_id=tenant.id,
            property_id=resolved_prop_id,
            membership_id=selected_membership.id,
            role_code=role.code if role else None,
            role_name=role.name if role else None,
            allowed_property_ids=allowed_property_ids,
            permissions=permissions,
        )

    # 2. Demo fallback if no Bearer token provided (allows seamless local testing during migration):
    req_tenant_id = x_tenant_id or "tenant-1"
    tenant = db.query(Tenant).filter(Tenant.id == req_tenant_id).first()
    if not tenant:
        first_tenant = db.query(Tenant).first()
        if first_tenant:
            tenant = first_tenant
            req_tenant_id = first_tenant.id
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant '{req_tenant_id}' not found",
            )

    if tenant.status == "Suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tenant Account Suspended: {tenant.suspended_reason or 'Please contact SIGNINN Support.'}",
        )

    all_props = db.query(Property).filter(Property.tenant_id == tenant.id).all()
    prop_ids = [p.id for p in all_props]

    # Grant standard operational permissions for unauthenticated demo requests
    demo_perms = [
        "reservation.view", "reservation.create", "reservation.modify", "reservation.cancel",
        "stay.view", "stay.checkin", "stay.checkout", "stay.room_move",
        "guest.view", "guest.create", "guest.modify",
        "folio.view", "folio.charge", "folio.adjust",
        "payment.view", "payment.collect",
        "room.view", "room.modify",
        "housekeeping.view", "housekeeping.update", "housekeeping.inspect",
        "maintenance.view", "maintenance.create", "maintenance.update",
        "rate.view", "rate.modify",
        "inventory.view",
        "distribution.view",
        "report.operational.view", "report.financial.view",
        "staff.view", "staff.manage",
        "property.settings.view", "property.settings.manage",
        "tenant.settings.view",
        "audit.view",
    ]

    demo_prop_id = x_property_id or (prop_ids[0] if prop_ids else None)
    return AuthContext(
        user_id="demo-user",
        user_email="demo@signinn.com",
        user_name="Demo User",
        is_platform_user=False,
        tenant_id=tenant.id,
        property_id=demo_prop_id,
        role_code="OWNER",
        role_name="Owner",
        allowed_property_ids=prop_ids,
        permissions=demo_perms,
    )


def require_platform_user(
    auth: AuthContext = Depends(get_auth_context),
) -> AuthContext:
    if not auth.is_platform_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: SIGNINN Platform Super Admin authorization required.",
        )
    return auth


def require_permission(permission_code: str):
    def check_permission(auth: AuthContext = Depends(get_auth_context)) -> AuthContext:
        if auth.is_platform_user or "*" in auth.permissions:
            return auth
        if permission_code not in auth.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Missing required permission '{permission_code}'.",
            )
        return auth
    return check_permission


def require_property_access(property_id: str):
    def check_property(auth: AuthContext = Depends(get_auth_context)) -> AuthContext:
        if auth.is_platform_user or "*" in auth.permissions:
            return auth
        if property_id not in auth.allowed_property_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: No access to property '{property_id}'.",
            )
        return auth
    return check_property


# Backward-compatible helpers for existing routers:
def get_current_tenant_id(
    auth: AuthContext = Depends(get_auth_context),
) -> str:
    if not auth.tenant_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required.")
    return auth.tenant_id


def get_current_tenant(
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
) -> Tenant:
    if not auth.tenant_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required.")
    tenant = db.query(Tenant).filter(Tenant.id == auth.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found.")
    return tenant


def check_tenant_active(
    tenant: Tenant = Depends(get_current_tenant),
) -> Tenant:
    if tenant.status == "Suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tenant Account Suspended: {tenant.suspended_reason or 'Please contact SIGNINN Support.'}",
        )
    return tenant
