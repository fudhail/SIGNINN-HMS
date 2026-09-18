import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import Tenant, User, PropertyAccess, Role, Permission

client = TestClient(app)


def test_login_superadmin():
    response = client.post("/api/auth/login", json={
        "email": "superadmin@signinn.com",
        "password": "password123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["is_platform_user"] is True
    assert "access_token" in data
    assert data["platform_role"] == "SIGNINN Super Admin"


def test_login_hotel_user():
    response = client.post("/api/auth/login", json={
        "email": "alex.morgan@grandazure.com",
        "password": "password123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["is_platform_user"] is False
    assert data["tenant"]["id"] == "tenant-1"
    assert len(data["permitted_properties"]) >= 1
    assert "access_token" in data


def test_login_invalid_credentials():
    response = client.post("/api/auth/login", json={
        "email": "alex.morgan@grandazure.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


def test_hotel_user_cannot_access_platform_metrics():
    # Login as hotel front desk
    login_res = client.post("/api/auth/login", json={
        "email": "priya.desk@grandazure.com",
        "password": "password123",
    })
    token = login_res.json()["access_token"]

    # Try to access platform metrics
    res = client.get("/api/tenants/platform/metrics", headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 403
    assert "SIGNINN Platform Super Admin authorization required" in res.json()["detail"]


def test_superadmin_can_access_platform_metrics():
    login_res = client.post("/api/auth/login", json={
        "email": "superadmin@signinn.com",
        "password": "password123",
    })
    token = login_res.json()["access_token"]

    res = client.get("/api/tenants/platform/metrics", headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 200
    assert "totalTenants" in res.json()


def test_cross_tenant_access_blocked():
    # Login as Grand Azure user (tenant-1)
    login_res = client.post("/api/auth/login", json={
        "email": "priya.desk@grandazure.com",
        "password": "password123",
    })
    token = login_res.json()["access_token"]

    # Attempt to query properties of tenant-2
    res = client.get("/api/properties", headers={
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": "tenant-2",
    })
    assert res.status_code == 403
    assert "You are not a member of tenant 'tenant-2'" in res.json()["detail"]


def test_unauthorized_property_access_blocked():
    # Priya (Front Desk) only has access to prop-1 (Kochi), not prop-1b (Goa)
    login_res = client.post("/api/auth/login", json={
        "email": "priya.desk@grandazure.com",
        "password": "password123",
    })
    token = login_res.json()["access_token"]

    res = client.get("/api/properties/prop-1b", headers={
        "Authorization": f"Bearer {token}",
        "X-Property-ID": "prop-1b",
    })
    assert res.status_code == 403
    assert "No access to property 'prop-1b'" in res.json()["detail"] or "Access denied" in res.json()["detail"]


def test_front_desk_cannot_modify_rates():
    login_res = client.post("/api/auth/login", json={
        "email": "priya.desk@grandazure.com",
        "password": "password123",
    })
    token = login_res.json()["access_token"]

    res = client.put("/api/rates/rp-101", json={"base_price_multiplier": 1.5}, headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 403
    assert "rate.modify" in res.json()["detail"]


def test_housekeeping_cannot_collect_payment():
    login_res = client.post("/api/auth/login", json={
        "email": "sunita.clean@grandazure.com",
        "password": "password123",
    })
    token = login_res.json()["access_token"]

    res = client.post("/api/billing/folios/fol-101/payments", json={
        "amount": 500.0,
        "method": "Cash",
    }, headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 403
    assert "payment.collect" in res.json()["detail"]


def test_owner_can_modify_rates():
    login_res = client.post("/api/auth/login", json={
        "email": "alex.morgan@grandazure.com",
        "password": "password123",
    })
    token = login_res.json()["access_token"]

    res = client.put("/api/rates/rp-1", json={"base_price_multiplier": 1.2}, headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 200
