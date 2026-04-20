

# FaceAttend — Smart Attendance System

## Features

- **Role-Based Authentication** — Separate Admin and Student portals with JWT (access + refresh tokens)
- **AI Face Recognition** — RetinaFace for detection + ArcFace for 512-d embedding with cosine similarity matching
- **Face Registration** — Admins register students; embeddings stored securely in PostgreSQL
- **Attendance Window Control** — Admins set start/end time per lecture; students can only mark within that window
- **Eligibility Tracking** — Students below 75% attendance are automatically flagged as Not Eligible
- **Email Notifications** — Auto-sends login credentials via SMTP when a student account is created
- **Analytics Dashboard** — Visual attendance trends and stats via Recharts
- **Export Reports** — Download attendance records as CSV or PDF

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Zustand, React Router v6, Recharts, Axios |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic |
| **Database** | PostgreSQL 15 |
| **Face Recognition** | InsightFace (ArcFace + RetinaFace) |
| **Auth** | JWT (access + refresh tokens) |
| **Email** | SMTP via Python `smtplib` |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### 1. Clone the Repository

```bash
git clone https://github.com/shakti52/Attendance-app_face_recognition.git
cd Attendance-app_face_recognition
```

### 2. PostgreSQL Setup

```sql
CREATE DATABASE attendance_db;
CREATE USER attendance_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE attendance_db TO attendance_user;
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Fill in your values
alembic upgrade head            # Run DB migrations
python main.py
```

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env            # Fill in your values
npm run dev
```

### 5. Seed Admin User

```bash
cd backend
python -m app.utils.seed_admin
```

API will be live at `http://localhost:8000` | Frontend at `http://localhost:5173`

---

## Environment Variables

### Backend `.env`

```env
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

```env
VITE_API_BASE_URL=http://localhost:8000
```

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

## How Face Recognition Works

```
1. Admin registers student → webcam captures frame
2. RetinaFace detects face bounding box
3. ArcFace generates 512-dimensional embedding vector
4. Embedding stored in PostgreSQL

At attendance time:
5. Student opens webcam → live frame captured
6. RetinaFace detects face → ArcFace generates embedding
7. Cosine similarity compared against stored embedding
8. Match above threshold → attendance marked
```

---

## Screenshots

> Add screenshots here — Admin dashboard, student face registration, and attendance marking screen.

---

## Future Improvements

- [ ] Docker & Docker Compose setup
- [ ] Anti-spoofing (liveness detection)
- [ ] Mobile-responsive UI
- [ ] Bulk student import via CSV
- [ ] Push notifications

---

## Author

**Shakti Singh**  
