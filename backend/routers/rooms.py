from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_current_tenant_id
from backend.models import Room, RoomType, AuditLog
from backend.schemas import RoomResponse, RoomTypeResponse, RoomUpdateStatus

router = APIRouter(tags=["Rooms & Room Types"])


@router.get("/api/room-types", response_model=List[RoomTypeResponse])
def get_room_types(
    property_id: Optional[str] = None,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    query = db.query(RoomType).filter(RoomType.tenant_id == tenant_id)
    if property_id:
        query = query.filter(RoomType.property_id == property_id)
    return query.all()


@router.get("/api/rooms", response_model=List[RoomResponse])
def get_rooms(
    property_id: Optional[str] = None,
    occupancy_status: Optional[str] = None,
    housekeeping_status: Optional[str] = None,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    query = db.query(Room).filter(Room.tenant_id == tenant_id)
    if property_id:
        query = query.filter(Room.property_id == property_id)
    if occupancy_status:
        query = query.filter(Room.occupancy_status == occupancy_status)
    if housekeeping_status:
        query = query.filter(Room.housekeeping_status == housekeeping_status)
    return query.order_by(Room.room_number).all()


@router.get("/api/rooms/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter(Room.id == room_id, Room.tenant_id == tenant_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.patch("/api/rooms/{room_id}/housekeeping")
def update_room_housekeeping_status(
    room_id: str,
    payload: Dict[str, str],
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter(Room.id == room_id, Room.tenant_id == tenant_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    new_status = payload.get("status")
    if new_status:
        old_status = room.housekeeping_status
        room.housekeeping_status = new_status
        # Log to audit log
        log = AuditLog(
            id=f"log-{int(room.room_number) * 100 + 1}",
            tenant_id=tenant_id,
            staff_name="Housekeeping Attendant",
            action="Housekeeping Status Update",
            entity_id=room_id,
            details=f"Room {room.room_number} status updated: {old_status} → {new_status}",
        )
        db.add(log)
        db.commit()
    return {"message": "Housekeeping status updated", "status": new_status, "roomId": room_id}


@router.patch("/api/rooms/{room_id}/maintenance")
def update_room_maintenance_status(
    room_id: str,
    payload: Dict[str, str],
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter(Room.id == room_id, Room.tenant_id == tenant_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    new_status = payload.get("status")
    if new_status:
        old_status = room.maintenance_status
        room.maintenance_status = new_status
        log = AuditLog(
            id=f"log-{int(room.room_number) * 100 + 2}",
            tenant_id=tenant_id,
            staff_name="Maintenance Lead",
            action="Maintenance Status Update",
            entity_id=room_id,
            details=f"Room {room.room_number} maintenance: {old_status} → {new_status}",
        )
        db.add(log)
        db.commit()
    return {"message": "Maintenance status updated", "status": new_status, "roomId": room_id}
