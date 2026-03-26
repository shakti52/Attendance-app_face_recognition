from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.database import engine
from app.models.user import Base
from app.api import auth, admin, student

# Create tables (use Alembic for production migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FaceAttend API",
    description="Smart Facial Recognition Attendance System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded face images
os.makedirs("uploads/faces", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(student.router)


@app.get("/")
def root():
    return {"message": "FaceAttend API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
