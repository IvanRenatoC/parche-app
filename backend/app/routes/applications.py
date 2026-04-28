from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import get_current_user, require_owner, AuthenticatedUser
from app.firebase.client import get_db
from app.schemas.schemas import ApplicationWithdraw, ApplicationOut
from app.services.application_service import accept_application as _accept
from datetime import datetime, timezone

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("/{application_id}/withdraw", response_model=ApplicationOut)
async def withdraw_application(
    application_id: str,
    payload: ApplicationWithdraw,
    user: AuthenticatedUser = Depends(get_current_user),
):
    db = get_db()
    ref = db.collection("applications").document(application_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Postulación no encontrada")
    data = doc.to_dict()
    if data["worker_uid"] != user.uid:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    if data["status"] != "applied":
        raise HTTPException(status_code=400, detail=f"No se puede retirar una postulación en estado '{data['status']}'")

    now = datetime.now(timezone.utc)
    ref.update({
        "status": "withdrawn",
        "withdraw_reason": payload.reason,
        "updated_at": now,
    })

    db.collection("audit_logs").add({
        "event_type": "application_withdrawn",
        "actor_uid": user.uid,
        "affected_uid": None,
        "resource_type": "application",
        "resource_id": application_id,
        "metadata": {"reason": payload.reason, "job_post_id": data["job_post_id"]},
        "created_at": now,
    })

    updated = ref.get().to_dict()
    return ApplicationOut(id=application_id, **updated)


@router.post("/{application_id}/accept")
async def accept_application(
    application_id: str,
    owner: AuthenticatedUser = Depends(require_owner),
):
    """
    Accept a worker application. This is the critical business flow:
    - Validates owner, publication state, application state, schedule overlap
    - Marks application as accepted
    - Marks remaining applications as not_selected
    - Creates notifications for non-selected workers
    - Sends emails if provider is active
    - Records audit log
    """
    try:
        result = _accept(application_id, owner.uid)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
