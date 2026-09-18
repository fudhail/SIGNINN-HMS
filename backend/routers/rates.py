from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import require_permission, get_current_tenant_id, AuthContext
from backend.models import RatePlan
from backend.schemas import RatePlanResponse

router = APIRouter(prefix="/api/rates", tags=["Rates & Yield Management"])


@router.get("", response_model=List[RatePlanResponse])
def get_rate_plans(
    auth: AuthContext = Depends(require_permission("rate.view")),
    db: Session = Depends(get_db),
):
    return db.query(RatePlan).filter(RatePlan.tenant_id == auth.tenant_id).all()


@router.put("/{plan_id}")
def update_rate_plan(
    plan_id: str,
    payload: Dict[str, Any],
    auth: AuthContext = Depends(require_permission("rate.modify")),
    db: Session = Depends(get_db),
):
    plan = db.query(RatePlan).filter(
        RatePlan.id == plan_id,
        RatePlan.tenant_id == auth.tenant_id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Rate plan not found")

    for k, v in payload.items():
        if hasattr(plan, k):
            setattr(plan, k, v)

    db.commit()
    return {"message": "Rate plan updated successfully", "planId": plan.id}
