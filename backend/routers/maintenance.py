from typing import List, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import require_permission, AuthContext
from backend.models import MaintenanceTicket, Room, generate_id
from backend.schemas import MaintenanceTicketResponse, MaintenanceTicketCreate

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance Tickets"])


@router.get("/tickets", response_model=List[MaintenanceTicketResponse])
def get_tickets(
    auth: AuthContext = Depends(require_permission("maintenance.view")),
    db: Session = Depends(get_db),
):
    return db.query(MaintenanceTicket).filter(MaintenanceTicket.tenant_id == auth.tenant_id).all()


@router.post("/tickets", response_model=MaintenanceTicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    t_in: MaintenanceTicketCreate,
    auth: AuthContext = Depends(require_permission("maintenance.create")),
    db: Session = Depends(get_db),
):
    new_id = generate_id("mnt")
    ticket = MaintenanceTicket(
        id=new_id,
        tenant_id=auth.tenant_id,
        room_id=t_in.room_id,
        room_number=t_in.room_number,
        title=t_in.title,
        description=t_in.description,
        priority=t_in.priority,
        status="Reported",
        reported_by=t_in.reported_by,
        category=t_in.category,
    )
    db.add(ticket)

    # Flag room as Maintenance Required
    if t_in.room_id:
        room = db.query(Room).filter(Room.id == t_in.room_id, Room.tenant_id == auth.tenant_id).first()
        if room:
            room.maintenance_status = "Maintenance Required"

    db.commit()
    db.refresh(ticket)
    return ticket


@router.patch("/tickets/{ticket_id}/status")
def update_ticket_status(
    ticket_id: str,
    payload: Dict[str, str],
    auth: AuthContext = Depends(require_permission("maintenance.update")),
    db: Session = Depends(get_db),
):
    ticket = db.query(MaintenanceTicket).filter(
        MaintenanceTicket.id == ticket_id,
        MaintenanceTicket.tenant_id == auth.tenant_id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    new_status = payload.get("status")
    if new_status:
        ticket.status = new_status
        if new_status == "Resolved":
            ticket.resolved_at = datetime.utcnow().isoformat()
            # If resolved, set room maintenance status back to Operational if no other open tickets
            if ticket.room_id:
                other_open = db.query(MaintenanceTicket).filter(
                    MaintenanceTicket.room_id == ticket.room_id,
                    MaintenanceTicket.id != ticket.id,
                    MaintenanceTicket.status != "Resolved",
                ).count()
                if other_open == 0:
                    room = db.query(Room).filter(Room.id == ticket.room_id).first()
                    if room:
                        room.maintenance_status = "Operational"
        db.commit()

    return {"message": "Ticket status updated", "status": new_status, "ticketId": ticket_id}
