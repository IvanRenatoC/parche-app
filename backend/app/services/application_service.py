"""
Critical business logic: accept_application

This service implements the full acceptance flow:
1. Validate owner owns the publication
2. Validate publication is in 'published' state
3. Validate application exists and is in 'applied' state
4. Validate no schedule overlap for the worker
5. Mark application as 'accepted'
6. Increment accepted_workers_count
7. If count >= required_workers, mark job_post as 'filled'
8. Mark all remaining 'applied' applications as 'not_selected'
9. Create internal notification for each non-selected worker
10. Send email if provider is active
11. Create audit_log entry
"""

import logging
from datetime import datetime, timezone
from google.cloud import firestore as firestore_types
from app.firebase.client import get_db
from app.services.email_service import send_not_selected_email

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _schedule_overlaps(
    db,
    worker_uid: str,
    start_date: str,
    end_date: str,
    start_time: str,
    end_time: str,
    exclude_job_post_id: str,
) -> bool:
    """Return True if the worker has an accepted application with overlapping schedule."""
    accepted_apps = (
        db.collection("applications")
        .where("worker_uid", "==", worker_uid)
        .where("status", "==", "accepted")
        .stream()
    )

    for app_doc in accepted_apps:
        app = app_doc.to_dict()
        job_post_id = app.get("job_post_id")
        if job_post_id == exclude_job_post_id:
            continue

        jp_doc = db.collection("job_posts").document(job_post_id).get()
        if not jp_doc.exists:
            continue
        jp = jp_doc.to_dict()

        # Simple date overlap check
        if jp.get("start_date") <= end_date and jp.get("end_date") >= start_date:
            # They share at least one date — check time overlap
            if jp.get("start_time") < end_time and jp.get("end_time") > start_time:
                return True

    return False


def accept_application(application_id: str, owner_uid: str) -> dict:
    """
    Full acceptance flow. Raises ValueError for business rule violations.
    Returns dict with summary of actions taken.
    """
    db = get_db()

    # ── 1. Load application ──────────────────────────────────────
    app_ref = db.collection("applications").document(application_id)
    app_doc = app_ref.get()
    if not app_doc.exists:
        raise ValueError("Postulación no encontrada")
    application = app_doc.to_dict()

    # ── 2. Validate owner ────────────────────────────────────────
    if application.get("owner_uid") != owner_uid:
        raise ValueError("No tienes permiso para aceptar esta postulación")

    # ── 3. Load job post ─────────────────────────────────────────
    job_post_id = application["job_post_id"]
    jp_ref = db.collection("job_posts").document(job_post_id)
    jp_doc = jp_ref.get()
    if not jp_doc.exists:
        raise ValueError("Publicación no encontrada")
    job_post = jp_doc.to_dict()

    if job_post.get("status") != "published":
        raise ValueError(f"La publicación está en estado '{job_post.get('status')}', no puede aceptar postulantes")

    # ── 4. Validate application state ────────────────────────────
    if application.get("status") != "applied":
        raise ValueError(f"La postulación ya está en estado '{application.get('status')}'")

    # ── 5. Validate schedule overlap ─────────────────────────────
    worker_uid = application["worker_uid"]
    has_overlap = _schedule_overlaps(
        db=db,
        worker_uid=worker_uid,
        start_date=job_post["start_date"],
        end_date=job_post["end_date"],
        start_time=job_post["start_time"],
        end_time=job_post["end_time"],
        exclude_job_post_id=job_post_id,
    )
    if has_overlap:
        raise ValueError("El worker ya tiene un turno aceptado que coincide en horario con esta publicación")

    # ── 6. Accept application ────────────────────────────────────
    now = _now()
    app_ref.update({
        "status": "accepted",
        "updated_at": now,
    })

    # ── 7. Update accepted_workers_count ─────────────────────────
    new_count = (job_post.get("accepted_workers_count") or 0) + 1
    required = job_post.get("required_workers", 1)
    new_status = "filled" if new_count >= required else job_post.get("status", "published")

    jp_ref.update({
        "accepted_workers_count": new_count,
        "status": new_status,
        "updated_at": now,
    })

    # ── 8. Mark remaining applications as not_selected ───────────
    remaining = (
        db.collection("applications")
        .where("job_post_id", "==", job_post_id)
        .where("status", "==", "applied")
        .stream()
    )
    not_selected_uids: list[str] = []
    for other_doc in remaining:
        other = other_doc.to_dict()
        if other_doc.id == application_id:
            continue
        db.collection("applications").document(other_doc.id).update({
            "status": "not_selected",
            "updated_at": now,
        })
        not_selected_uids.append(other.get("worker_uid", ""))

    # ── 9 & 10. Create notifications + send emails ───────────────
    notifications_created = 0
    emails_sent = 0
    job_title = job_post.get("title", "publicación")

    # Notify the accepted worker
    db.collection("notifications").add({
        "recipient_uid": worker_uid,
        "recipient_role": "",
        "type": "application_accepted",
        "title": "¡Te seleccionaron para el turno!",
        "message": (
            f"El negocio te seleccionó para \"{job_title}\". "
            "Confirma tu participación en la app para que el negocio lo sepa."
        ),
        "related_job_post_id": job_post_id,
        "related_application_id": application_id,
        "read": False,
        "read_by": [],
        "created_at": now,
    })
    notifications_created += 1

    for wuid in not_selected_uids:
        if not wuid:
            continue

        # Create internal notification
        db.collection("notifications").add({
            "recipient_uid": wuid,
            "recipient_role": "",
            "type": "application_not_selected",
            "title": "No fuiste seleccionado en esta oportunidad",
            "message": (
                "En esta oportunidad hemos seleccionado a otro postulante. "
                "Estuvo difícil la decisión y te invitamos a estar atento/a "
                "a próximas oportunidades en Parche."
            ),
            "related_job_post_id": job_post_id,
            "related_application_id": None,
            "read": False,
            "read_by": [],
            "created_at": now,
        })
        notifications_created += 1

        # Get worker email for sending
        try:
            worker_user = db.collection("users").document(wuid).get()
            if worker_user.exists:
                worker_email = worker_user.to_dict().get("email", "")
                if worker_email:
                    sent = send_not_selected_email(worker_email, job_title)
                    if sent:
                        emails_sent += 1
        except Exception as e:
            logger.warning("Error sending email to worker %s: %s", wuid, e)

    # ── 11. Audit log ─────────────────────────────────────────────
    db.collection("audit_logs").add({
        "event_type": "application_accepted",
        "actor_uid": owner_uid,
        "affected_uid": worker_uid,
        "resource_type": "application",
        "resource_id": application_id,
        "metadata": {
            "job_post_id": job_post_id,
            "job_post_title": job_title,
            "new_job_post_status": new_status,
            "accepted_workers_count": new_count,
            "required_workers": required,
            "not_selected_count": len(not_selected_uids),
            "notifications_created": notifications_created,
            "emails_sent": emails_sent,
        },
        "created_at": now,
    })

    logger.info(
        "Application %s accepted. Job post %s → %s (%d/%d). "
        "Not selected: %d. Notifications: %d. Emails: %d.",
        application_id, job_post_id, new_status,
        new_count, required,
        len(not_selected_uids), notifications_created, emails_sent,
    )

    return {
        "application_id": application_id,
        "job_post_id": job_post_id,
        "job_post_status": new_status,
        "accepted_workers_count": new_count,
        "required_workers": required,
        "not_selected_count": len(not_selected_uids),
        "notifications_created": notifications_created,
        "emails_sent": emails_sent,
    }
