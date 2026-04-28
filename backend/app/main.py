from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routes import users, businesses, job_posts, applications, notifications
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="Parche API",
    description="API para la plataforma Parche — turnos temporales en gastronomía y retail",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users.router)
app.include_router(businesses.router)
app.include_router(job_posts.router)
app.include_router(applications.router)
app.include_router(notifications.router)


@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "app": "parche-api",
        "env": settings.APP_ENV,
        "project": settings.GCP_PROJECT_ID,
    }


@app.get("/", tags=["health"])
async def root():
    return {"message": "Parche API v0.1.0 — /docs para ver la documentación"}
