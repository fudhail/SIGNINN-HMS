import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import Room, HousekeepingTask, MaintenanceTicket, User
from backend.security import create_access_token

client = TestClient(app)


def get_auth_headers(role: str = "role-gm", tenant_id: str = "tenant-1"):
    db = SessionLocal()
    user = db.query(User).filter(User.email == "rohit.gm@grandazure.com").first()
    db.close()
    token = create_access_token(
        data={
            "sub": user.id if user else "usr-gm",
            "email": "rohit.gm@grandazure.com",
            "tenant_id": tenant_id,
            "role": role,
            "is_platform_user": False,
        }
    )
    return {
        "Authorization": f"Bearer {token}",
        "X-Tenant-Id": tenant_id,
        "X-Property-Id": "prop-1",
    }


def test_rooms_count_and_numerical_sorting():
    """Verify that 50 rooms are returned and strictly sorted naturally 101..510."""
    headers = get_auth_headers()
    response = client.get("/api/rooms", headers=headers)
    assert response.status_code == 200
    rooms = response.json()
    assert len(rooms) == 50

    room_numbers = [int(r["room_number"]) for r in rooms]
    assert room_numbers == sorted(room_numbers), "Rooms must be in strict ascending numerical order"
    assert room_numbers[0] == 101
    assert room_numbers[-1] == 510


def test_zero_rooms_out_of_order_on_fresh_seed():
    """Verify that all 50 rooms are initially Operational with zero out of order."""
    headers = get_auth_headers()
    response = client.get("/api/rooms", headers=headers)
    assert response.status_code == 200
    rooms = response.json()
    ooo_rooms = [r for r in rooms if r["maintenance_status"] != "Operational"]
    assert len(ooo_rooms) == 0, f"Found {len(ooo_rooms)} out of order rooms: {[r['room_number'] for r in ooo_rooms]}"


def test_housekeeping_task_lifecycle_and_room_sync():
    """Verify updating a housekeeping task updates the underlying room status."""
    headers = get_auth_headers()
    res = client.get("/api/housekeeping/tasks", headers=headers)
    assert res.status_code == 200
    tasks = res.json()
    assert len(tasks) > 0

    target_task = tasks[0]
    task_id = target_task["id"]
    room_id = target_task["room_id"]

    # 1. Update task to 'Clean'
    patch_res = client.patch(
        f"/api/housekeeping/tasks/{task_id}/status",
        json={"status": "Clean"},
        headers=headers,
    )
    assert patch_res.status_code == 200

    # 2. Verify room status was updated
    room_res = client.get(f"/api/rooms/{room_id}", headers=headers)
    assert room_res.status_code == 200
    assert room_res.json()["housekeeping_status"] == "Clean"


def test_maintenance_ticket_lifecycle_and_room_lock():
    """Verify filing maintenance locks room as 'Maintenance Required', and resolving it restores 'Operational'."""
    headers = get_auth_headers()

    # 1. Create ticket for Room 101
    post_res = client.post(
        "/api/maintenance/tickets",
        json={
            "room_id": "rm-101",
            "room_number": "101",
            "title": "Air filter inspection and replacement",
            "description": "Routine quarterly maintenance check",
            "priority": "Medium",
            "reported_by": "System Audit Test",
            "category": "Air Conditioning",
        },
        headers=headers,
    )
    assert post_res.status_code == 201
    ticket_data = post_res.json()
    ticket_id = ticket_data["id"]

    # 2. Check that Room 101 is now flagged Maintenance Required
    room_res = client.get("/api/rooms/rm-101", headers=headers)
    assert room_res.status_code == 200
    assert room_res.json()["maintenance_status"] == "Maintenance Required"

    # 3. Resolve the ticket
    resolve_res = client.patch(
        f"/api/maintenance/tickets/{ticket_id}/status",
        json={"status": "Resolved"},
        headers=headers,
    )
    assert resolve_res.status_code == 200

    # 4. Check that Room 101 is restored to Operational
    room_res_after = client.get("/api/rooms/rm-101", headers=headers)
    assert room_res_after.status_code == 200
    assert room_res_after.json()["maintenance_status"] == "Operational"


def test_rate_plans_and_channels_availability():
    """Verify rate plans and channels endpoints respond with seeded configurations."""
    headers = get_auth_headers()
    rates_res = client.get("/api/rates", headers=headers)
    assert rates_res.status_code == 200
    rates = rates_res.json()
    assert len(rates) >= 4

    channels_res = client.get("/api/channels", headers=headers)
    assert channels_res.status_code == 200
    channels = channels_res.json()
    assert len(channels) == 26
