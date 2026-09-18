from typing import List, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import require_permission, AuthContext
from backend.models import HousekeepingTask, Room
from backend.schemas import HousekeepingTaskResponse

router = APIRouter(prefix="/api/housekeeping", tags=["Housekeeping Operations"])


@router.get("/tasks", response_model=List[HousekeepingTaskResponse])
def get_housekeeping_tasks(
    auth: AuthContext = Depends(require_permission("housekeeping.view")),
    db: Session = Depends(get_db),
):
    return db.query(HousekeepingTask).filter(HousekeepingTask.tenant_id == auth.tenant_id).all()


@router.patch("/tasks/{task_id}/status")
def update_task_status(
    task_id: str,
    payload: Dict[str, str],
    auth: AuthContext = Depends(require_permission("housekeeping.update")),
    db: Session = Depends(get_db),
):
    task = db.query(HousekeepingTask).filter(
        HousekeepingTask.id == task_id,
        HousekeepingTask.tenant_id == auth.tenant_id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    new_status = payload.get("status")
    if new_status:
        task.status = new_status
        task.last_updated = datetime.utcnow().isoformat()

        # If task is marked Ready or Clean, update the physical room's housekeeping status as well!
        room = db.query(Room).filter(Room.id == task.room_id).first()
        if room:
            room.housekeeping_status = new_status

        db.commit()

    return {"message": "Task status updated", "status": new_status, "taskId": task_id}


@router.post("/tasks/{task_id}/toggle-item")
def toggle_task_checklist_item(
    task_id: str,
    payload: Dict[str, str],
    auth: AuthContext = Depends(require_permission("housekeeping.update")),
    db: Session = Depends(get_db),
):
    task = db.query(HousekeepingTask).filter(
        HousekeepingTask.id == task_id,
        HousekeepingTask.tenant_id == auth.tenant_id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    item_id = payload.get("itemId")
    items = list(task.checklist or [])
    for it in items:
        if it.get("id") == item_id:
            it["done"] = not it.get("done", False)
            break
    task.checklist = items
    db.commit()
    return {"message": "Checklist updated", "checklist": task.checklist}
