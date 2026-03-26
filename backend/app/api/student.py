from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import require_student
from app.core.config import settings
from app.models.user import User, StudentProfile, Subject, Lecture, Attendance
from app.schemas.schemas import (
    StudentAttendanceDashboard, AttendanceSummary, FaceVerifyRequest
)
from app.utils.face_recognition import register_face, verify_face, save_face_image

router = APIRouter(prefix="/api/student", tags=["student"])

ELIGIBILITY_THRESHOLD = 75.0


# ── Face Registration ─────────────────────────────────────────────────────────

@router.post("/register-face")
def register_student_face(
    payload: FaceVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """First-time face registration. Stores embedding in DB."""
    if current_user.is_face_registered:
        raise HTTPException(400, "Face already registered. Contact admin to re-register.")

    embedding_json, error = register_face(payload.image_base64)
    if error:
        raise HTTPException(400, error)

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(404, "Student profile not found")

    profile.face_embedding = embedding_json
    # Optionally save the image
    img_path = save_face_image(
        payload.image_base64,
        settings.UPLOAD_DIR,
        f"{current_user.id_number}.jpg",
    )
    profile.face_image_path = img_path
    current_user.is_face_registered = True
    db.commit()

    return {"detail": "Face registered successfully. You can now mark attendance."}


# ── Mark Attendance via Face ──────────────────────────────────────────────────

@router.post("/attendance/mark")
def mark_attendance_face(
    payload: FaceVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    if not current_user.is_face_registered:
        raise HTTPException(400, "Please register your face first.")

    # Validate lecture exists and attendance window is open
    lecture = db.query(Lecture).filter(Lecture.id == payload.lecture_id).first()
    if not lecture:
        raise HTTPException(404, "Lecture not found")
    if not lecture.attendance_open:
        raise HTTPException(403, "Attendance window is not open for this lecture.")

    # Check already marked
    existing = db.query(Attendance).filter(
        Attendance.student_id == current_user.id,
        Attendance.lecture_id == payload.lecture_id,
    ).first()
    if existing and existing.status == "present":
        raise HTTPException(400, "Attendance already marked for this lecture.")

    # Get stored embedding
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile or not profile.face_embedding:
        raise HTTPException(400, "No face embedding found. Please re-register.")

    matched, similarity, error = verify_face(
        payload.image_base64,
        profile.face_embedding,
        threshold=settings.FACE_SIMILARITY_THRESHOLD,
    )

    if error:
        raise HTTPException(400, error)

    if not matched:
        raise HTTPException(401, f"Face not recognized (similarity: {similarity:.2f}). Please try again.")

    # Mark present
    if existing:
        existing.status = "present"
        existing.marked_by = "face"
        existing.marked_at = datetime.utcnow()
        existing.confidence = similarity
    else:
        record = Attendance(
            student_id=current_user.id,
            lecture_id=payload.lecture_id,
            status="present",
            marked_by="face",
            marked_at=datetime.utcnow(),
            confidence=similarity,
        )
        db.add(record)
    db.commit()

    return {"detail": "Attendance marked successfully!", "similarity": similarity}


# ── Dashboard / Attendance Summary ────────────────────────────────────────────

@router.get("/dashboard", response_model=StudentAttendanceDashboard)
def student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(404, "Profile not found")

    subjects = db.query(Subject).filter(Subject.class_name == profile.class_name).all()
    summaries: List[AttendanceSummary] = []

    total_lectures_all = 0
    total_present_all = 0

    for subject in subjects:
        lectures = db.query(Lecture).filter(Lecture.subject_id == subject.id).all()
        lecture_ids = [l.id for l in lectures]
        total = len(lecture_ids)
        present = db.query(Attendance).filter(
            Attendance.student_id == current_user.id,
            Attendance.lecture_id.in_(lecture_ids),
            Attendance.status == "present",
        ).count() if lecture_ids else 0

        percentage = (present / total * 100) if total else 0.0
        summaries.append(AttendanceSummary(
            subject_id=subject.id,
            subject_name=subject.name,
            subject_code=subject.code,
            total_lectures=total,
            present=present,
            absent=total - present,
            percentage=round(percentage, 1),
            eligible=percentage >= ELIGIBILITY_THRESHOLD,
        ))
        total_lectures_all += total
        total_present_all += present

    overall_pct = (total_present_all / total_lectures_all * 100) if total_lectures_all else 0.0

    return StudentAttendanceDashboard(
        student_name=profile.full_name,
        id_number=current_user.id_number,
        class_name=profile.class_name,
        overall_percentage=round(overall_pct, 1),
        eligible=overall_pct >= ELIGIBILITY_THRESHOLD,
        subjects=summaries,
    )


# ── Open Lectures ─────────────────────────────────────────────────────────────

@router.get("/lectures/open")
def get_open_lectures(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Return lectures currently open for attendance for the student's class."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(404, "Profile not found")

    lectures = (
        db.query(Lecture)
        .options(joinedload(Lecture.subject))
        .join(Subject)
        .filter(
            Lecture.attendance_open == True,
            Subject.class_name == profile.class_name,
        )
        .all()
    )

    result = []
    for lec in lectures:
        already_marked = db.query(Attendance).filter(
            Attendance.student_id == current_user.id,
            Attendance.lecture_id == lec.id,
            Attendance.status == "present",
        ).first() is not None
        result.append({
            "id": lec.id,
            "subject_name": lec.subject.name,
            "subject_code": lec.subject.code,
            "date": str(lec.date),
            "start_time": str(lec.start_time),
            "end_time": str(lec.end_time),
            "already_marked": already_marked,
        })
    return result
