from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Text, Enum as SAEnum, Date, Time
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime
import enum
from app.core.database import Base


class RoleEnum(str, enum.Enum):
    admin = "admin"
    student = "student"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    id_number = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(RoleEnum), default=RoleEnum.student, nullable=False)
    is_active = Column(Boolean, default=True)
    is_face_registered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("StudentProfile", back_populates="user", uselist=False)
    attendances = relationship("Attendance", back_populates="student")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    full_name = Column(String(150), nullable=False)
    class_name = Column(String(100), nullable=False)   # e.g. "SE-A", "TE-B"
    division = Column(String(20), nullable=True)
    phone = Column(String(20), nullable=True)
    face_embedding = Column(Text, nullable=True)        # JSON-serialized float list
    face_image_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    code = Column(String(30), unique=True, nullable=False)
    class_name = Column(String(100), nullable=False)
    credits = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)

    lectures = relationship("Lecture", back_populates="subject")


class Lecture(Base):
    __tablename__ = "lectures"

    id = Column(Integer, primary_key=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    attendance_open = Column(Boolean, default=False)   # admin toggles this
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject", back_populates="lectures")
    attendances = relationship("Attendance", back_populates="lecture")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False)
    status = Column(String(10), default="absent")      # present | absent
    marked_by = Column(String(10), default="face")     # face | admin
    marked_at = Column(DateTime, nullable=True)
    confidence = Column(Float, nullable=True)           # face match confidence

    student = relationship("User", back_populates="attendances")
    lecture = relationship("Lecture", back_populates="attendances")
