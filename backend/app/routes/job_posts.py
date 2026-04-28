from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.auth.dependencies import get_current_user, require_owner, AuthenticatedUser
from app.firebase.client import get_db
from app.schemas.schemas import (
    JobPostCreate, JobPostUpdate, JobPostClose, JobPostOut, ApplicationOut, ApplicationCreate, ApplicationWithdraw
)
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/job-posts", tags=["job-posts"])


@router.get("", response_model=list[JobPostOut])
async def list_job_posts(
    status_filter: str = Query(default="published", alias="status"),
    region: str | None = None,
    occupation: str | None = None,
    user: AuthenticatedUser = Depends(get_current_user),
):
    db = get_db()
    user_doc = db.collection("users").document(user.uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    role = user_doc.to_dict().get("role")

    query = db.collection("job_posts")

    if role == "owner":
        query = query.where("owner_uid", "==", user.uid)
    else:
        query = query.where("status", "==", status_filter)
        if region:
            query = query.where("region", "==", region)
        if occupation:
            query = query.where("occupation", "==", occupation)

    docs = query.order_by("created_at", direction="DESCENDING").limit(100).stream()
    result = []
    for d in docs:
        data = d.to_dict()
        result.append(JobPostOut(
            id=d.id,
            owner_uid=data.get("owner_uid", ""),
            business_id=data.get("business_id", ""),
            title=data.get("title", ""),
            occupation=data.get("occupation", ""),
            description=data.get("description", ""),
            requirements=data.get("requirements", ""),
            start_date=data.get("start_date", ""),
            end_date=data.get("end_date", ""),
            start_time=data.get("start_time", ""),
            end_time=data.get("end_time", ""),
            required_workers=data.get("required_workers", 1),
            salary_total_clp=data.get("salary_total_clp", 0),
            region=data.get("region", ""),
            commune=data.get("commune", ""),
            accepted_workers_count=data.get("accepted_workers_count", 0),
            status=data.get("status", "published"),
            close_reason=data.get("close_reason"),
        ))
    return result


@router.post("", response_model=JobPostOut, status_code=status.HTTP_201_CREATED)
async def create_job_post(
    payload: JobPostCreate,
    owner: AuthenticatedUser = Depends(require_owner),
):
    db = get_db()
    now = datetime.now(timezone.utc)
    jp_id = str(uuid.uuid4())
    data = {
        **payload.model_dump(),
        "owner_uid": owner.uid,
        "accepted_workers_count": 0,
        "status": "published",
        "close_reason": None,
        "created_at": now,
        "updated_at": now,
    }
    db.collection("job_posts").document(jp_id).set(data)
    return JobPostOut(id=jp_id, **data)


@router.patch("/{job_post_id}", response_model=JobPostOut)
async def update_job_post(
    job_post_id: str,
    payload: JobPostUpdate,
    owner: AuthenticatedUser = Depends(require_owner),
):
    db = get_db()
    ref = db.collection("job_posts").document(job_post_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    data = doc.to_dict()
    if data["owner_uid"] != owner.uid:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc)
    ref.update(updates)

    updated = ref.get().to_dict()
    return JobPostOut(
        id=job_post_id,
        owner_uid=updated["owner_uid"],
        **{k: updated.get(k, data.get(k)) for k in [
            "business_id", "title", "occupation", "description", "requirements",
            "start_date", "end_date", "start_time", "end_time",
            "required_workers", "salary_total_clp", "region", "commune",
            "accepted_workers_count", "status", "close_reason",
        ]},
    )


@router.post("/{job_post_id}/close", status_code=status.HTTP_200_OK)
async def close_job_post(
    job_post_id: str,
    payload: JobPostClose,
    owner: AuthenticatedUser = Depends(require_owner),
):
    db = get_db()
    ref = db.collection("job_posts").document(job_post_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    if doc.to_dict()["owner_uid"] != owner.uid:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    ref.update({
        "status": "closed",
        "close_reason": payload.reason,
        "updated_at": datetime.now(timezone.utc),
    })

    db.collection("audit_logs").add({
        "event_type": "job_post_closed",
        "actor_uid": owner.uid,
        "affected_uid": None,
        "resource_type": "job_post",
        "resource_id": job_post_id,
        "metadata": {"reason": payload.reason},
        "created_at": datetime.now(timezone.utc),
    })
    return {"message": "Publicación cerrada"}


@router.get("/{job_post_id}/applications", response_model=list[ApplicationOut])
async def get_applications(
    job_post_id: str,
    owner: AuthenticatedUser = Depends(require_owner),
):
    db = get_db()
    jp_doc = db.collection("job_posts").document(job_post_id).get()
    if not jp_doc.exists:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    if jp_doc.to_dict()["owner_uid"] != owner.uid:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    docs = (
        db.collection("applications")
        .where("job_post_id", "==", job_post_id)
        .order_by("created_at", direction="DESCENDING")
        .stream()
    )
    return [ApplicationOut(id=d.id, **d.to_dict()) for d in docs]


@router.post("/{job_post_id}/applications", status_code=status.HTTP_201_CREATED, response_model=ApplicationOut)
async def apply_to_job_post(
    job_post_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    db = get_db()
    user_doc = db.collection("users").document(user.uid).get()
    if not user_doc.exists or user_doc.to_dict().get("role") != "worker":
        raise HTTPException(status_code=403, detail="Se requiere rol worker")

    jp_doc = db.collection("job_posts").document(job_post_id).get()
    if not jp_doc.exists:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
    jp = jp_doc.to_dict()
    if jp.get("status") != "published":
        raise HTTPException(status_code=400, detail="La publicación no está disponible")

    # Check if already applied
    existing = (
        db.collection("applications")
        .where("job_post_id", "==", job_post_id)
        .where("worker_uid", "==", user.uid)
        .where("status", "==", "applied")
        .limit(1)
        .stream()
    )
    if any(True for _ in existing):
        raise HTTPException(status_code=400, detail="Ya postulaste a esta publicación")

    now = datetime.now(timezone.utc)
    app_id = str(uuid.uuid4())
    app_data = {
        "job_post_id": job_post_id,
        "owner_uid": jp["owner_uid"],
        "worker_uid": user.uid,
        "status": "applied",
        "withdraw_reason": None,
        "rejection_reason": None,
        "auto_rejection_message_sent": False,
        "created_at": now,
        "updated_at": now,
    }
    db.collection("applications").document(app_id).set(app_data)

    # Notify owner
    db.collection("notifications").add({
        "recipient_uid": jp["owner_uid"],
        "type": "new_application",
        "title": "Nueva postulación",
        "message": f"Un worker postuló a '{jp.get('title', 'tu publicación')}'.",
        "related_job_post_id": job_post_id,
        "related_application_id": app_id,
        "read": False,
        "created_at": now,
    })

    return ApplicationOut(id=app_id, **app_data)
