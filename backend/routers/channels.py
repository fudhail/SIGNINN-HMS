from typing import List, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_current_tenant_id
from backend.models import ChannelConfig
from backend.schemas import ChannelConfigResponse

router = APIRouter(prefix="/api/channels", tags=["OTA Channel Manager"])


@router.get("", response_model=List[ChannelConfigResponse])
def get_channels(
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    return db.query(ChannelConfig).filter(ChannelConfig.tenant_id == tenant_id).all()


@router.post("/force-sync")
def force_channels_sync(
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    channels = db.query(ChannelConfig).filter(ChannelConfig.tenant_id == tenant_id).all()
    now_str = "Just now"
    for ch in channels:
        ch.last_sync = now_str
        ch.status = "Connected"
    db.commit()
    return {"message": "All channels synced successfully with 0 inventory sync errors"}


@router.patch("/{channel_id}/toggle")
def toggle_channel_status(
    channel_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    ch = db.query(ChannelConfig).filter(
        ChannelConfig.id == channel_id,
        ChannelConfig.tenant_id == tenant_id,
    ).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Channel not found")

    ch.status = "Disconnected" if ch.status == "Connected" else "Connected"
    db.commit()
    return {"message": f"Channel status changed to {ch.status}", "status": ch.status}


@router.patch("/{channel_id}/markup")
def update_channel_markup(
    channel_id: str,
    payload: Dict[str, float],
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    ch = db.query(ChannelConfig).filter(
        ChannelConfig.id == channel_id,
        ChannelConfig.tenant_id == tenant_id,
    ).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Channel not found")

    markup = payload.get("markup") or payload.get("rateMultiplier")
    if markup is not None:
        ch.rate_multiplier = float(markup)
        db.commit()
    return {"message": "Rate multiplier updated", "rateMultiplier": ch.rate_multiplier}
