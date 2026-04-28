import firebase_admin
from firebase_admin import credentials, firestore, auth
from functools import lru_cache
import os
from app.config import get_settings

_initialized = False


def init_firebase() -> None:
    global _initialized
    if _initialized or firebase_admin._apps:
        return
    settings = get_settings()
    cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
    else:
        # Use Application Default Credentials (works in Cloud Run)
        cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {
        "projectId": settings.FIREBASE_PROJECT_ID,
    })
    _initialized = True


@lru_cache
def get_db():
    init_firebase()
    return firestore.client()


def get_auth_client():
    init_firebase()
    return auth
