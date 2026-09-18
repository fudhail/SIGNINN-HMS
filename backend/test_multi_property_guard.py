import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import Tenant, User, Property, TenantMembership, Role, generate_id
from backend.security import hash_password

client = TestClient(app)


def test_multi_property_enforcement_and_mrr():
    # 1. Login as Super Admin
    login_res = client.post("/api/auth/login", json={
        "email": "superadmin@signinn.com",
        "password": "password123",
    })
    assert login_res.status_code == 200
    superadmin_token = login_res.json()["access_token"]
    superadmin_headers = {"Authorization": f"Bearer {superadmin_token}"}

    import uuid
    uniq = uuid.uuid4().hex[:6]
    slug = f"palmtree-{uniq}"
    email = f"rohan-{uniq}@palmtree.com"

    # 2. Provision a new client on Starter Plan (single property strictly)
    tenant_payload = {
        "name": f"Palm Tree Boutique Inn {uniq}",
        "slug": slug,
        "subdomain": f"{slug}.signinn.com",
        "owner_name": "Rohan Nair",
        "owner_email": email,
        "owner_phone": "+91 98470 11223",
        "plan": "Starter",
        "billing_cycle": "Monthly",
        "max_rooms": 20,
        "features": {
            "multiProperty": False,
            "qrRoomService": False,
        },
    }
    create_res = client.post("/api/tenants", json=tenant_payload, headers=superadmin_headers)
    assert create_res.status_code == 201
    tenant_data = create_res.json()
    tenant_id = tenant_data["id"]
    assert tenant_data["plan"] == "Starter"
    assert tenant_data["mrr"] == 4499.0  # Base Starter MRR
    assert tenant_data["features"]["multiProperty"] is False

    # 3. Create a tenant user with OWNER role
    db = SessionLocal()
    owner_role = db.query(Role).filter(Role.code == "OWNER").first()
    assert owner_role is not None

    user_id = generate_id("usr")
    user = User(
        id=user_id,
        email=email,
        hashed_password=hash_password("password123"),
        name="Rohan Nair",
        phone="+91 98470 11223",
        is_platform_user=False,
        status="Active",
    )
    db.add(user)

    mem = TenantMembership(
        id=generate_id("mem"),
        user_id=user_id,
        tenant_id=tenant_id,
        role_id=owner_role.id,
        status="Active",
    )
    db.add(mem)
    db.commit()
    db.close()

    # Login as this tenant's owner
    tenant_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "password123",
    })
    assert tenant_login.status_code == 200
    tenant_token = tenant_login.json()["access_token"]
    tenant_headers = {"Authorization": f"Bearer {tenant_token}"}

    # 4. Attempt to create a 2nd property for this client (should be blocked by multi-property guard)
    second_prop_payload = {
        "name": "Palm Tree Beach Villa",
        "code": "PTB-02",
        "city": "Varkala",
        "state": "Kerala",
        "currency": "INR",
        "timezone": "Asia/Kolkata",
        "total_rooms": 10,
    }
    blocked_res = client.post("/api/properties", json=second_prop_payload, headers=tenant_headers)
    assert blocked_res.status_code == 403
    assert "Multi-property feature is not enabled" in blocked_res.json()["detail"]

    # 5. Super Admin activates Multi-Property Add-on (+₹4,999/mo) and QR Room Service (+₹1,499/mo)
    patch_res = client.patch(
        f"/api/tenants/{tenant_id}/features",
        json={"features": {"multiProperty": True, "qrRoomService": True}},
        headers=superadmin_headers,
    )
    assert patch_res.status_code == 200
    updated_tenant = patch_res.json()
    assert updated_tenant["features"]["multiProperty"] is True
    assert updated_tenant["features"]["qrRoomService"] is True
    # Base 4499 + MultiProperty 4999 + QR 1499 = 10997
    assert updated_tenant["mrr"] == 10997.0

    # 6. Attempt to create the 2nd property again (now permitted)
    allowed_res = client.post("/api/properties", json=second_prop_payload, headers=tenant_headers)
    assert allowed_res.status_code == 201
    assert allowed_res.json()["name"] == "Palm Tree Beach Villa"
    assert allowed_res.json()["tenant_id"] == tenant_id
