from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user, AuthenticatedUser
from app.firebase.client import get_db
from app.schemas.schemas import NotificationOut
from datetime import datetime, timezone

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
async def list_notifications(user: AuthenticatedUser = Depends(get_current_user)):
    db = get_db()
    docs = (
        db.collection("notifications")
        .where("recipient_uid", "==", user.uid)
        .order_by("created_at", direction="DESCENDING")
        .limit(50)
        .stream()
    )
    result = []
    for d in docs:
        data = d.to_dict()
        result.append(NotificationOut(
            id=d.id,
            recipient_uid=data["recipient_uid"],
            type=data.get("type", "general"),
            title=data.get("title", ""),
            message=data.get("message", ""),
            related_job_post_id=data.get("related_job_post_id"),
            related_application_id=data.get("related_application_id"),
            read=data.get("read", False),
        ))
    return result


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    db = get_db()
    ref = db.collection("notifications").document(notification_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    if doc.to_dict()["recipient_uid"] != user.uid:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    ref.update({"read": True})
    return {"message": "Notificación marcada como leída"}
