from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import get_current_user, AuthenticatedUser
from app.firebase.client import get_db
from app.schemas.schemas import UserOut, OwnerProfileCreate, WorkerProfileCreate
from datetime import datetime, timezone

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(user: AuthenticatedUser = Depends(get_current_user)):
    db = get_db()
    doc = db.collection("users").document(user.uid).get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    data = doc.to_dict()
    return UserOut(
        uid=data["uid"],
        email=data["email"],
        role=data.get("role"),
        rut=data.get("rut"),
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        profile_completed=data.get("profile_completed", False),
        email_verified=data.get("email_verified", False),
    )


@router.post("/profiles/owner", status_code=status.HTTP_201_CREATED)
async def create_owner_profile(
    payload: OwnerProfileCreate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    db = get_db()
    now = datetime.now(timezone.utc)
    db.collection("users").document(user.uid).set({
        "uid": user.uid,
        "email": user.email,
        "role": "owner",
        "rut": payload.rut,
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "profile_completed": True,
        "email_verified": False,
        "updated_at": now,
    }, merge=True)
    db.collection("owners").document(user.uid).set({
        "uid": user.uid,
        "updated_at": now,
    }, merge=True)
    return {"message": "Perfil owner creado"}


@router.post("/profiles/worker", status_code=status.HTTP_201_CREATED)
async def create_worker_profile(
    payload: WorkerProfileCreate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    db = get_db()
    now = datetime.now(timezone.utc)
    db.collection("users").document(user.uid).set({
        "uid": user.uid,
        "email": user.email,
        "role": "worker",
        "rut": payload.rut,
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "profile_completed": True,
        "email_verified": False,
        "updated_at": now,
    }, merge=True)
    db.collection("workers").document(user.uid).set({
        "uid": user.uid,
        "rut": payload.rut,
        "nationality": payload.nationality,
        "occupations": [o.model_dump() for o in payload.occupations],
        "certificates": [],
        "profile_photo_url": "",
        "identity_document_url": "",
        "status": "active",
        "updated_at": now,
    }, merge=True)
    return {"message": "Perfil worker creado"}
