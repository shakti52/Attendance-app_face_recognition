"""
Run once to create the default admin account:
  python -m app.utils.seed_admin
"""
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.core.config import settings
from app.models.user import User, RoleEnum


def seed():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if existing:
            print(f"Admin already exists: {settings.ADMIN_EMAIL}")
            return
        admin = User(
            email=settings.ADMIN_EMAIL,
            id_number="ADMIN001",
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            role=RoleEnum.admin,
            is_face_registered=True,
        )
        db.add(admin)
        db.commit()
        print(f"Admin created: {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
