"""
Payment service stub — cobro de USD 1.5 por publicación.

PAYMENTS_ENABLED=false (default): permite publicar sin cobro, registra
un charge con status "disabled" opcionalmente. No bloquea el flujo.

PAYMENTS_ENABLED=true (futuro): bloquea la publicación si no existe un
charge con status "paid" o crédito válido para el owner. Requiere
integración con proveedor (stripe / mercadopago / manual).
"""

from datetime import datetime, timezone
from typing import Optional
from app.config import get_settings
from app.firebase.client import get_db


def is_publication_payment_required() -> bool:
    return get_settings().PAYMENTS_ENABLED


def can_owner_publish(owner_uid: str) -> bool:
    """
    Returns True if the owner is allowed to publish a new job post.
    When PAYMENTS_ENABLED=False, always returns True.
    When PAYMENTS_ENABLED=True, checks for a paid/credited charge (stub placeholder).
    """
    if not is_publication_payment_required():
        return True
    # Stub: in production, query publication_charges for a valid paid charge.
    # For now, block publishing when payments are enabled but not integrated.
    return False


def create_publication_charge(
    owner_uid: str,
    job_post_id: Optional[str] = None,
) -> dict:
    """
    Creates a publication_charges document in Firestore.
    When PAYMENTS_ENABLED=False, status is "disabled" (no real charge).
    When PAYMENTS_ENABLED=True, status is "pending" (awaiting payment).
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)
    status = "pending" if settings.PAYMENTS_ENABLED else "disabled"

    charge = {
        "owner_uid": owner_uid,
        "job_post_id": job_post_id,
        "amount_usd": settings.PUBLICATION_PRICE_USD,
        "currency": "USD",
        "status": status,
        "payment_provider": settings.PAYMENT_PROVIDER,
        "provider_payment_id": None,
        "created_at": now,
        "updated_at": now,
    }

    db = get_db()
    ref = db.collection("publication_charges").document()
    ref.set(charge)
    return {"id": ref.id, **charge}


def mark_charge_paid(charge_id: str) -> None:
    """Marks a publication charge as paid. Called by payment webhook."""
    now = datetime.now(timezone.utc)
    db = get_db()
    db.collection("publication_charges").document(charge_id).update({
        "status": "paid",
        "updated_at": now,
    })
