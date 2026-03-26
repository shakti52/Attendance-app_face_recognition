# FaceAttend — Smart Attendance System

A facial recognition–powered attendance system built with Python (FastAPI), PostgreSQL, React, ArcFace & RetinaFace.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Zustand, React Router v6, Recharts, Axios |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 15 |
| Face Recognition | InsightFace (ArcFace + RetinaFace) |
| Auth | JWT (access + refresh tokens) |
| Email | SMTP via Python `smtplib` |

---

## Project Structure

```
attendance-system/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   ├── core/         # Config, security, database
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── utils/        # Face recognition, email helpers
│   ├── alembic/          # DB migrations
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/   # Reusable UI components
    │   ├── pages/        # Admin & Student pages
    │   ├── hooks/        # Custom React hooks
    │   ├── store/        # Zustand state management
    │   └── utils/        # API client, helpers
    ├── package.json
    └── .env.example
```

---

## Setup Instructions

### 1. PostgreSQL
```sql
CREATE DATABASE attendance_db;
CREATE USER attendance_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE attendance_db TO attendance_user;
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Fill in your values
alembic upgrade head       # Run migrations
python main.py
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env       # Fill in your values
npm run dev
```

### 4. Admin Seed
After migrations, seed the default admin:
```bash
cd backend
python -m app.utils.seed_admin
```

---

## Key Features

- **Role-based login**: Admin / Student selection on landing page
- **Face Registration**: RetinaFace detects face → ArcFace embeds 512-d vector → stored in DB
- **Face Verification**: Live webcam frame matched against stored embedding (cosine similarity)
- **Attendance Window**: Admin sets start/end time per lecture; students can only mark within that window
- **Eligibility**: Students below 75% attendance flagged as "Not Eligible"
- **Email Notifications**: Auto-send credentials when admin creates a student account
- **Export**: Download attendance records as CSV or PDF

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://attendance_user:yourpassword@localhost:5432/attendance_db
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@college.edu
ADMIN_PASSWORD=Admin@123
```

### Frontend `.env`
```
VITE_API_BASE_URL=http://localhost:8000
```
