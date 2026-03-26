from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, date, time


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str  # "admin" | "student"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    is_face_registered: bool


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Student ───────────────────────────────────────────────────────────────────

class StudentCreate(BaseModel):
    email: EmailStr
    id_number: str
    password: str
    full_name: str
    class_name: str
    division: Optional[str] = None
    phone: Optional[str] = None


class StudentOut(BaseModel):
    id: int
    email: str
    id_number: str
    is_active: bool
    is_face_registered: bool
    full_name: Optional[str] = None
    class_name: Optional[str] = None
    division: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StudentListOut(BaseModel):
    id: int
    email: str
    id_number: str
    full_name: Optional[str]
    class_name: Optional[str]
    division: Optional[str]
    is_face_registered: bool
    is_active: bool

    class Config:
        from_attributes = True


# ── Subject ───────────────────────────────────────────────────────────────────

class SubjectCreate(BaseModel):
    name: str
    code: str
    class_name: str
    credits: int = 3


class SubjectOut(BaseModel):
    id: int
    name: str
    code: str
    class_name: str
    credits: int

    class Config:
        from_attributes = True


# ── Lecture ───────────────────────────────────────────────────────────────────

class LectureCreate(BaseModel):
    subject_id: int
    date: date
    start_time: time
    end_time: time


class LectureOut(BaseModel):
    id: int
    subject_id: int
    date: date
    start_time: time
    end_time: time
    attendance_open: bool
    subject: Optional[SubjectOut] = None

    class Config:
        from_attributes = True


# ── Attendance ────────────────────────────────────────────────────────────────

class AttendanceManualUpdate(BaseModel):
    student_id: int
    lecture_id: int
    status: str  # "present" | "absent"


class AttendanceRecord(BaseModel):
    id: int
    lecture_id: int
    status: str
    marked_by: str
    marked_at: Optional[datetime]
    subject_name: Optional[str]
    subject_code: Optional[str]
    date: Optional[date]

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    subject_id: int
    subject_name: str
    subject_code: str
    total_lectures: int
    present: int
    absent: int
    percentage: float
    eligible: bool


class StudentAttendanceDashboard(BaseModel):
    student_name: str
    id_number: str
    class_name: str
    overall_percentage: float
    eligible: bool
    subjects: List[AttendanceSummary]


# ── Face ──────────────────────────────────────────────────────────────────────

class FaceVerifyRequest(BaseModel):
    lecture_id: int
    image_base64: str  # base64-encoded JPEG frame from webcam
