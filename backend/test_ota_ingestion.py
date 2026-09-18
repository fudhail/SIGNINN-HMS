import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db, SessionLocal
from backend.models import Tenant, Property, Reservation, Folio, Guest, Room, OtaIngestionLog

client = TestClient(app)


def get_auth_token():
    """Obtain token for Owner (Alex Morgan)"""
    resp = client.post(
        "/api/auth/login",
        json={"email": "alex.morgan@grandazure.com", "password": "password123"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def test_jsonld_booking_ingestion():
    token = get_auth_token()
    test_id = f"BK-TEST-{uuid.uuid4().hex[:6]}"

    # Simulate Booking.com confirmation email with JSON-LD
    jsonld_html = f"""
    <html>
      <head>
        <script type="application/ld+json">
        {{
          "@context": "http://schema.org",
          "@type": "LodgingReservation",
          "reservationNumber": "{test_id}",
          "reservationStatus": "http://schema.org/Confirmed",
          "underName": {{
            "@type": "Person",
            "name": "Kavita Singhania"
          }},
          "checkinDate": "2026-10-10",
          "checkoutDate": "2026-10-13",
          "totalPrice": "24000.00",
          "priceCurrency": "INR",
          "reservedRoom": {{
            "@type": "LodgingRoom",
            "name": "Deluxe Room"
          }}
        }}
        </script>
      </head>
      <body>
        <p>Dear Hotelier, You have a new confirmed reservation on Booking.com.</p>
      </body>
    </html>
    """

    resp = client.post(
        "/api/ota/webhook/email-inbound",
        json={
            "to": "ota+prop-1@inbound.signinn.app",
            "from": "customer.service@booking.com",
            "subject": f"New Reservation: {test_id} - Kavita Singhania",
            "html": jsonld_html,
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["action"] == "created"
    assert data["ota_reservation_id"] == test_id
    assert "Kavita Singhania" in data["guest_name"]
    assert data["total_amount"] == 24000.0
    assert data["nights"] == 3
    assert data["commission_amount"] == 3600.0  # 15% default

    # Verify reservation and folio in database
    db = SessionLocal()
    res = db.query(Reservation).filter_by(ota_reservation_id=test_id).first()
    assert res is not None
    assert res.booking_source == "Booking.com"
    assert res.status == "Confirmed"

    folio = db.query(Folio).filter_by(reservation_id=res.id).first()
    assert folio is not None
    assert folio.total_charges == 24000.0
    db.close()


def test_deduplication_and_cancellation():
    token = get_auth_token()
    dup_id = f"BK-DUP-{uuid.uuid4().hex[:6]}"

    # 1. Create first booking
    jsonld_html = f"""
    <script type="application/ld+json">
    {{
      "@type": "LodgingReservation",
      "reservationNumber": "{dup_id}",
      "checkinDate": "2026-10-15",
      "checkoutDate": "2026-10-17",
      "totalPrice": "15000.00",
      "underName": {{"name": "Pooja Hegde"}}
    }}
    </script>
    """
    resp1 = client.post(
        "/api/ota/webhook/email-inbound",
        json={
            "to": "ota+prop-1@inbound.signinn.app",
            "from": "customer.service@booking.com",
            "subject": f"New Booking {dup_id}",
            "html": jsonld_html,
        },
    )
    assert resp1.status_code == 200
    assert resp1.json()["action"] == "created"

    # 2. Ingest duplicate
    resp_dup = client.post(
        "/api/ota/webhook/email-inbound",
        json={
            "to": "ota+prop-1@inbound.signinn.app",
            "from": "customer.service@booking.com",
            "subject": f"Reminder: Booking {dup_id}",
            "html": jsonld_html,
        },
    )
    assert resp_dup.status_code == 200
    assert resp_dup.json()["action"] == "duplicate"

    # 3. Send Cancellation
    cancel_html = f"""
    <script type="application/ld+json">
    {{
      "@type": "LodgingReservation",
      "reservationNumber": "{dup_id}",
      "reservationStatus": "Cancelled",
      "underName": {{"name": "Pooja Hegde"}}
    }}
    </script>
    """
    resp_cancel = client.post(
        "/api/ota/webhook/email-inbound",
        json={
            "to": "ota+prop-1@inbound.signinn.app",
            "from": "customer.service@booking.com",
            "subject": f"Cancelled: Booking {dup_id}",
            "html": cancel_html,
        },
    )
    assert resp_cancel.status_code == 200
    assert resp_cancel.json()["action"] == "cancelled"

    db = SessionLocal()
    res = db.query(Reservation).filter_by(ota_reservation_id=dup_id).first()
    assert res.status == "Cancelled"
    db.close()


def test_makemytrip_email_simulation():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/ota/simulate-email",
        headers=headers,
        json={
            "channel": "MakeMyTrip",
            "property_id": "prop-1",
            "guest_name": "Rohan Malhotra",
            "guest_phone": "+91 99887 76655",
            "guest_email": f"rohan.{uuid.uuid4().hex[:4]}@gmail.com",
            "nights": 2,
            "total_amount": 16000.0,
            "commission_rate": 18.0,
            "payment_mode": "Virtual Card (VCC)",
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["action"] == "created"
    assert "Rohan Malhotra" in data["guest_name"]
    assert data["total_amount"] == 16000.0
    assert data["commission_amount"] == 2880.0  # 18% of 16000


def test_ical_export_feed():
    # Public RFC 5545 calendar feed test
    resp = client.get("/api/ical/prop-1.ics")
    assert resp.status_code == 200, resp.text
    assert "text/calendar" in resp.headers["content-type"]
    content = resp.text
    assert "BEGIN:VCALENDAR" in content
    assert "VERSION:2.0" in content
    assert "PRODID:-//SIGNINN HMS//EN" in content
    assert "BEGIN:VEVENT" in content
    assert "END:VCALENDAR" in content


def test_csv_reconciliation():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    id1 = f"CSV-{uuid.uuid4().hex[:6]}"
    id2 = f"CSV-{uuid.uuid4().hex[:6]}"

    sample_csv = f"""Booking Number,Guest Name,Check-in,Check-out,Gross Amount,Commission %,Status
{id1},Amit Verma,2026-11-01,2026-11-04,18000,15%,Confirmed
{id2},Deepa Nair,2026-11-05,2026-11-08,21000,15%,Confirmed
"""

    resp = client.post(
        "/api/ota/reconcile-csv",
        headers=headers,
        json={
            "property_id": "prop-1",
            "csv_content": sample_csv,
            "channel": "Booking.com",
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total_rows"] == 2
    assert data["created_count"] == 2
    assert data["total_revenue"] == 39000.0
    assert data["total_commission"] == 5850.0  # 15% of 39000

