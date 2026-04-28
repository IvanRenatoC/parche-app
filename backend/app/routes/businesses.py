from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import require_owner, AuthenticatedUser
from app.firebase.client import get_db
from app.schemas.schemas import BusinessCreate, BusinessOut
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/businesses", tags=["businesses"])


@router.get("", response_model=list[BusinessOut])
async def list_businesses(owner: AuthenticatedUser = Depends(require_owner)):
    db = get_db()
    docs = db.collection("businesses").where("owner_uid", "==", owner.uid).stream()
    result = []
    for d in docs:
        data = d.to_dict()
        result.append(BusinessOut(id=d.id, **data))
    return result


@router.post("", response_model=BusinessOut, status_code=status.HTTP_201_CREATED)
async def create_business(
    payload: BusinessCreate,
    owner: AuthenticatedUser = Depends(require_owner),
):
    db = get_db()
    now = datetime.now(timezone.utc)
    biz_id = str(uuid.uuid4())
    data = {
        **payload.model_dump(),
        "owner_uid": owner.uid,
        "created_at": now,
        "updated_at": now,
    }
    db.collection("businesses").document(biz_id).set(data)
    return BusinessOut(id=biz_id, **data)
