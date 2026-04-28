from pydantic import BaseModel, field_validator
from typing import Optional, Literal
from datetime import datetime


# ─── Common ─────────────────────────────────────────────────────────
class OccupationSchema(BaseModel):
    name: str
    years_experience: int = 0


class CertificateSchema(BaseModel):
    name: str
    url: str


# ─── User ───────────────────────────────────────────────────────────
class UserOut(BaseModel):
    uid: str
    email: str
    role: Optional[str]
    rut: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    profile_completed: bool
    email_verified: bool


class OwnerProfileCreate(BaseModel):
    rut: str
    first_name: str
    last_name: str


class WorkerProfileCreate(BaseModel):
    rut: str
    first_name: str
    last_name: str
    nationality: str
    occupations: list[OccupationSchema]


# ─── Business ───────────────────────────────────────────────────────
class BusinessCreate(BaseModel):
    business_rut: str
    business_name: str
    business_type: str
    business_subtype: str
    address: str
    place_id: str = ""
    lat: float = 0.0
    lng: float = 0.0
    region: str
    commune: str


class BusinessOut(BusinessCreate):
    id: str
    owner_uid: str


# ─── JobPost ────────────────────────────────────────────────────────
class JobPostCreate(BaseModel):
    business_id: str
    title: str
    occupation: str
    description: str
    requirements: str = ""
    start_date: str
    end_date: str
    start_time: str
    end_time: str
    required_workers: int
    salary_total_clp: int
    region: str
    commune: str

    @field_validator("required_workers")
    @classmethod
    def workers_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("required_workers debe ser >= 1")
        return v


class JobPostUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    salary_total_clp: Optional[int] = None
    status: Optional[str] = None


class JobPostClose(BaseModel):
    reason: str


class JobPostOut(JobPostCreate):
    id: str
    owner_uid: str
    accepted_workers_count: int
    status: str
    close_reason: Optional[str]


# ─── Application ─────────────────────────────────────────────────────
class ApplicationCreate(BaseModel):
    job_post_id: str


class ApplicationWithdraw(BaseModel):
    reason: str


class ApplicationOut(BaseModel):
    id: str
    job_post_id: str
    owner_uid: str
    worker_uid: str
    status: str
    withdraw_reason: Optional[str]
    rejection_reason: Optional[str]


# ─── Comment ─────────────────────────────────────────────────────────
class CommentCreate(BaseModel):
    job_post_id: str
    content: str
    parent_id: Optional[str] = None


class CommentOut(CommentCreate):
    id: str
    author_uid: str
    author_role: str
    author_name: str


# ─── Notification ────────────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: str
    recipient_uid: str
    type: str
    title: str
    message: str
    related_job_post_id: Optional[str]
    related_application_id: Optional[str]
    read: bool


# ─── Rating ──────────────────────────────────────────────────────────
class RatingCreate(BaseModel):
    to_uid: str
    job_post_id: str
    score: int
    comment: str = ""

    @field_validator("score")
    @classmethod
    def score_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("score debe estar entre 1 y 5")
        return v
