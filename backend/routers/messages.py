from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_current_tenant_id
from backend.models import MessageThread, Message, generate_id

router = APIRouter(prefix="/api/messages", tags=["Guest Communication & Messages"])


class SendMessageRequest(BaseModel):
    content: str
    sender: Optional[str] = "hotel"


class MessageResponse(BaseModel):
    id: str
    sender: str
    content: str
    timestamp: str
    status: str

    class Config:
        from_attributes = True


class MessageThreadResponse(BaseModel):
    id: str
    tenant_id: str
    property_id: Optional[str] = None
    guest_name: str
    guest_phone: str
    room_number: Optional[str] = None
    reservation_ref: Optional[str] = None
    channel: str
    unread_count: int
    created_at: str
    last_message_at: str
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


@router.get("/threads")
def get_message_threads(
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    threads = (
        db.query(MessageThread)
        .filter(MessageThread.tenant_id == tenant_id)
        .order_by(MessageThread.last_message_at.desc())
        .all()
    )
    result = []
    for t in threads:
        result.append({
            "id": t.id,
            "guestName": t.guest_name,
            "guestPhone": t.guest_phone,
            "roomNumber": t.room_number,
            "reservationRef": t.reservation_ref,
            "channel": t.channel,
            "unreadCount": t.unread_count,
            "messages": [
                {
                    "id": m.id,
                    "sender": m.sender,
                    "content": m.content,
                    "timestamp": m.timestamp,
                    "status": m.status,
                }
                for m in t.messages
            ],
        })
    return result


@router.post("/threads/{thread_id}/messages")
def send_message(
    thread_id: str,
    payload: SendMessageRequest,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    thread = (
        db.query(MessageThread)
        .filter(MessageThread.id == thread_id, MessageThread.tenant_id == tenant_id)
        .first()
    )
    if not thread:
        raise HTTPException(status_code=404, detail="Message thread not found")

    now = datetime.utcnow().isoformat()
    new_msg = Message(
        id=generate_id("msg"),
        thread_id=thread.id,
        sender=payload.sender or "hotel",
        content=payload.content,
        timestamp=now,
        status="sent",
    )
    db.add(new_msg)
    thread.last_message_at = now
    db.commit()
    db.refresh(new_msg)

    return {
        "id": new_msg.id,
        "sender": new_msg.sender,
        "content": new_msg.content,
        "timestamp": new_msg.timestamp,
        "status": new_msg.status,
    }


@router.patch("/threads/{thread_id}/read")
def mark_thread_read(
    thread_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    thread = (
        db.query(MessageThread)
        .filter(MessageThread.id == thread_id, MessageThread.tenant_id == tenant_id)
        .first()
    )
    if not thread:
        raise HTTPException(status_code=404, detail="Message thread not found")

    thread.unread_count = 0
    for m in thread.messages:
        m.status = "read"
    db.commit()

    return {"message": "Thread marked as read", "threadId": thread_id}
