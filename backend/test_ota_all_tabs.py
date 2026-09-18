import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)
AUTH_HEADERS = {"X-Tenant-ID": "tenant-1"}

def test_tab1_channel_crud_and_markup():
    # 1. GET channels
    res = client.get("/api/channels", headers=AUTH_HEADERS)
    assert res.status_code == 200
    channels = res.json()
    assert len(channels) >= 4
    ch1 = channels[0]

    # 2. Update rate markup
    res = client.patch(
        f"/api/channels/{ch1['id']}/markup",
        json={"rateMultiplier": 1.15},
        headers=AUTH_HEADERS,
    )
    assert res.status_code == 200
    assert res.json()["rateMultiplier"] == 1.15

    # 3. Toggle channel status
    res = client.patch(f"/api/channels/{ch1['id']}/toggle", headers=AUTH_HEADERS)
    assert res.status_code == 200
    new_status = res.json()["status"]
    assert new_status in ["Connected", "Disconnected"]

    # 4. Force sync
    res = client.post("/api/channels/force-sync", headers=AUTH_HEADERS)
    assert res.status_code == 200
    assert "synced successfully" in res.json()["message"]


def test_tab2_email_ingestion_and_logs():
    # 1. Simulate email
    payload = {
        "channel": "Booking.com",
        "guest_name": "Audit E2E Guest",
        "guest_email": "audit.e2e@guest.com",
        "total_amount": 25000.0,
        "commission_rate": 15.0,
        "payment_mode": "Virtual Card (VCC)"
    }
    res = client.post("/api/ota/simulate-email", json=payload, headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["action"] == "created"
    assert data["guest_name"] == "Audit E2E Guest"
    assert "ref_code" in data
    assert "folio_id" in data

    # 2. Query ingestion logs
    res = client.get("/api/ota/ingestion-logs", headers=AUTH_HEADERS)
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) > 0
    assert any(l["guest_name"] == "Audit E2E Guest" for l in logs)


def test_tab3_csv_reconciliation():
    import uuid
    uid1 = uuid.uuid4().hex[:6].upper()
    uid2 = uuid.uuid4().hex[:6].upper()
    csv_body = f"""Booking Reference,Guest,Arrival,Departure,Total,Commission
BK-AUD-{uid1},Aarav Patel,2026-11-01,2026-11-04,30000,4500
BK-AUD-{uid2},Diya Sharma,2026-11-05,2026-11-07,18000,2700"""

    res = client.post(
        "/api/ota/reconcile-csv",
        json={"csv_content": csv_body, "channel": "Booking.com"},
        headers=AUTH_HEADERS,
    )
    assert res.status_code == 200
    summary = res.json()
    assert summary["total_rows"] == 2
    assert summary["created_count"] == 2
    assert summary["total_revenue"] == 48000.0

    # Running reconcile again should mark them matched
    res_repeat = client.post(
        "/api/ota/reconcile-csv",
        json={"csv_content": csv_body, "channel": "Booking.com"},
        headers=AUTH_HEADERS,
    )
    assert res_repeat.status_code == 200
    summary2 = res_repeat.json()
    assert summary2["matched_count"] == 2
    assert summary2["created_count"] == 0


def test_tab4_ical_export_and_inbound_sync():
    # 1. Export iCal feed
    res = client.get("/api/ical/prop-1.ics")
    assert res.status_code == 200
    assert "BEGIN:VCALENDAR" in res.text
    assert "END:VCALENDAR" in res.text

    # 2. Inbound sync
    res = client.post(
        "/api/ical/inbound/sync",
        json={"channel_name": "Airbnb", "ical_url": "https://airbnb.com/calendar/ical/999.ics"},
        headers=AUTH_HEADERS,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["synced_blocks"] > 0
