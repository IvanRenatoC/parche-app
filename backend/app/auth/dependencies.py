from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as firebase_auth
from app.firebase.client import get_auth_client, init_firebase
from dataclasses import dataclass

bearer_scheme = HTTPBearer()


@dataclass
class AuthenticatedUser:
    uid: str
    email: str
    role: str | None = None


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> AuthenticatedUser:
    init_firebase()
    token = creds.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    return AuthenticatedUser(
        uid=decoded["uid"],
        email=decoded.get("email", ""),
    )


async def require_owner(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    from app.firebase.client import get_db
    db = get_db()
    user_doc = db.collection("users").document(user.uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    data = user_doc.to_dict()
    if data.get("role") != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol owner")
    user.role = "owner"
    return user


async def require_worker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    from app.firebase.client import get_db
    db = get_db()
    user_doc = db.collection("users").document(user.uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    data = user_doc.to_dict()
    if data.get("role") != "worker":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol worker")
    user.role = "worker"
    return user
