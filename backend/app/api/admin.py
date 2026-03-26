from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date
import io, csv

from app.core.database import get_db
from app.core.security import require_admin, hash_password
from app.models.user import User, StudentProfile, Subject, Lecture, Attendance, RoleEnum
from app.schemas.schemas import (
    StudentCreate, StudentOut, StudentListOut,
    SubjectCreate, SubjectOut,
    LectureCreate, LectureOut,
    AttendanceManualUpdate,
)
from app.utils.email_service import send_credentials_email

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Students ──────────────────────────────────────────────────────────────────

@router.post("/students", response_model=StudentOut)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, "Email already registered")
    if db.query(User).filter(User.id_number == payload.id_number).first():
        raise HTTPException(400, "ID number already registered")

    user = User(
        email=payload.email,
        id_number=payload.id_number,
        hashed_password=hash_password(payload.password),
        role=RoleEnum.student,
    )
    db.add(user)
    db.flush()

    profile = StudentProfile(
        user_id=user.id,
        full_name=payload.full_name,
        class_name=payload.class_name,
        division=payload.division,
        phone=payload.phone,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    # Send credentials email (non-blocking — ignore failure)
    send_credentials_email(payload.email, payload.full_name, payload.id_number, payload.password)

    return _build_student_out(user)


@router.get("/students", response_model=List[StudentListOut])
def list_students(
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    q = db.query(User).options(joinedload(User.profile)).filter(User.role == RoleEnum.student)
    if class_name:
        q = q.join(StudentProfile).filter(StudentProfile.class_name == class_name)
    users = q.all()
    return [_build_student_list_out(u) for u in users]


@router.get("/students/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    user = _get_student_or_404(student_id, db)
    return _build_student_out(user)


@router.patch("/students/{student_id}/toggle-active")
def toggle_student_active(student_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    user = _get_student_or_404(student_id, db)
    user.is_active = not user.is_active
    db.commit()
    return {"is_active": user.is_active}


# ── Subjects ──────────────────────────────────────────────────────────────────

@router.post("/subjects", response_model=SubjectOut)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    if db.query(Subject).filter(Subject.code == payload.code).first():
        raise HTTPException(400, "Subject code already exists")
    subject = Subject(**payload.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/subjects", response_model=List[SubjectOut])
def list_subjects(class_name: Optional[str] = None, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    q = db.query(Subject)
    if class_name:
        q = q.filter(Subject.class_name == class_name)
    return q.all()


@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(404, "Subject not found")
    db.delete(subject)
    db.commit()
    return {"detail": "Deleted"}


# ── Lectures ──────────────────────────────────────────────────────────────────

@router.post("/lectures", response_model=LectureOut)
def create_lecture(payload: LectureCreate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    lecture = Lecture(**payload.model_dump())
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    return lecture


@router.get("/lectures", response_model=List[LectureOut])
def list_lectures(
    subject_id: Optional[int] = None,
    date_filter: Optional[date] = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    q = db.query(Lecture).options(joinedload(Lecture.subject))
    if subject_id:
        q = q.filter(Lecture.subject_id == subject_id)
    if date_filter:
        q = q.filter(Lecture.date == date_filter)
    return q.order_by(Lecture.date.desc(), Lecture.start_time).all()


@router.patch("/lectures/{lecture_id}/toggle-attendance")
def toggle_attendance_window(lecture_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(404, "Lecture not found")
    lecture.attendance_open = not lecture.attendance_open
    db.commit()
    return {"attendance_open": lecture.attendance_open}


# ── Manual Attendance ─────────────────────────────────────────────────────────

@router.post("/attendance/manual")
def manual_mark_attendance(
    payload: AttendanceManualUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    from datetime import datetime
    existing = db.query(Attendance).filter(
        Attendance.student_id == payload.student_id,
        Attendance.lecture_id == payload.lecture_id,
    ).first()

    if existing:
        existing.status = payload.status
        existing.marked_by = "admin"
        existing.marked_at = datetime.utcnow()
    else:
        record = Attendance(
            student_id=payload.student_id,
            lecture_id=payload.lecture_id,
            status=payload.status,
            marked_by="admin",
            marked_at=datetime.utcnow(),
        )
        db.add(record)
    db.commit()
    return {"detail": f"Attendance marked as {payload.status}"}


# ── Analytics & Export ────────────────────────────────────────────────────────

@router.get("/analytics/summary")
def attendance_analytics(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    total_students = db.query(User).filter(User.role == RoleEnum.student).count()
    total_lectures = db.query(Lecture).count()
    total_present = db.query(Attendance).filter(Attendance.status == "present").count()
    total_attendance_records = db.query(Attendance).count()
    avg_attendance = (total_present / total_attendance_records * 100) if total_attendance_records else 0

    below_75 = _count_below_threshold(db, 75.0)

    return {
        "total_students": total_students,
        "total_lectures": total_lectures,
        "average_attendance_pct": round(avg_attendance, 1),
        "students_below_threshold": below_75,
    }


@router.get("/export/attendance/csv")
def export_attendance_csv(
    class_name: Optional[str] = None,
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    q = (
        db.query(Attendance)
        .options(
            joinedload(Attendance.student).joinedload(User.profile),
            joinedload(Attendance.lecture).joinedload(Lecture.subject),
        )
    )
    records = q.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student Name", "ID Number", "Class", "Subject", "Date", "Status", "Marked By"])
    for r in records:
        profile = r.student.profile
        subject = r.lecture.subject if r.lecture else None
        writer.writerow([
            profile.full_name if profile else "",
            r.student.id_number,
            profile.class_name if profile else "",
            subject.name if subject else "",
            r.lecture.date if r.lecture else "",
            r.status,
            r.marked_by,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance.csv"},
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_student_or_404(student_id: int, db: Session) -> User:
    user = db.query(User).options(joinedload(User.profile)).filter(
        User.id == student_id, User.role == RoleEnum.student
    ).first()
    if not user:
        raise HTTPException(404, "Student not found")
    return user


def _build_student_out(user: User) -> dict:
    p = user.profile
    return StudentOut(
        id=user.id, email=user.email, id_number=user.id_number,
        is_active=user.is_active, is_face_registered=user.is_face_registered,
        full_name=p.full_name if p else None,
        class_name=p.class_name if p else None,
        division=p.division if p else None,
        created_at=user.created_at,
    )


def _build_student_list_out(user: User) -> dict:
    p = user.profile
    return StudentListOut(
        id=user.id, email=user.email, id_number=user.id_number,
        full_name=p.full_name if p else None,
        class_name=p.class_name if p else None,
        division=p.division if p else None,
        is_face_registered=user.is_face_registered,
        is_active=user.is_active,
    )


def _count_below_threshold(db: Session, threshold: float) -> int:
    students = db.query(User).filter(User.role == RoleEnum.student).all()
    count = 0
    for s in students:
        total = db.query(Attendance).filter(Attendance.student_id == s.id).count()
        if total == 0:
            continue
        present = db.query(Attendance).filter(
            Attendance.student_id == s.id, Attendance.status == "present"
        ).count()
        if (present / total * 100) < threshold:
            count += 1
    return count
