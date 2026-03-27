# PM Internship Scheme — Smart Allocation Engine

> **Problem Statement ID:** 25033  
> **Ministry:** Corporate Affairs, Government of India  
> **Module:** Step 01 — Candidate Module (Complete)

---

## 📋 Project Overview

A government-grade AI-based Smart Allocation Engine for the PM Internship Scheme that:

- Lets students register and build profiles (Step 01 ✅)
- Lets companies post internship opportunities (Step 02 — upcoming)
- Uses AI/ML to match candidates to internships (ML service included)
- Enforces affirmative action quotas (SC/ST/OBC, rural/aspirational)
- Has admin, candidate, and company dashboards
- Built modularly — one step at a time

---

## 🗂️ Folder Structure

```
/pm-internship-engine
  /frontend          → React.js + Tailwind CSS app
  /backend           → Node.js + Express.js API
  /ml-service        → Python Flask AI matching engine
  /seed-data         → 10 sample candidate JSON records
```

---

## ⚙️ Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | React.js 18 + Tailwind CSS          |
| Backend        | Node.js + Express.js                |
| Database       | MongoDB (Mongoose ODM)              |
| Auth           | JWT (jsonwebtoken + bcryptjs)       |
| File Upload    | Multer (PDF only, 2MB limit)        |
| Resume Parse   | pdf-parse + keyword NLP             |
| AI/ML Engine   | Python Flask + scikit-learn         |
| Charts         | Recharts (Step 02+)                 |

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js v18+
- MongoDB v6+ (running locally or Atlas URI)
- Python 3.10+
- npm or yarn

---

### 1. Clone & Navigate

```bash
cd pm-internship-engine
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` (already included):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/pm_internship_db
JWT_SECRET=pm_internship_super_secret_key_2024
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=2097152
ML_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

**Start MongoDB** (local):
```bash
mongod --dbpath /data/db
```

**Seed 10 sample candidates:**
```bash
node seed.js
```

Expected output:
```
✅  Connected to MongoDB for seeding...
🗑️   Cleared existing candidates
🌱  Seeded 10 candidates successfully!
   → Arjun Sharma (arjun.sharma@example.com) | General | Urban
   → Priya Devi (priya.devi@example.com) | OBC | Urban
   ...
```

**Start backend:**
```bash
npm run dev        # development (nodemon)
# or
npm start          # production
```

Backend runs on: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

### 4. ML Service Setup

```bash
cd ml-service
python -m venv venv
source venv/bin/activate     # Mac/Linux
# or: venv\Scripts\activate  # Windows

pip install -r requirements.txt
python app.py
```

ML service runs on: `http://localhost:8000`

---

## 🔌 API Reference (Step 01)

All routes prefixed: `/api/candidates`

| Method | Route                    | Auth | Description                        |
|--------|--------------------------|------|------------------------------------|
| POST   | `/register`              | ❌   | Register new candidate             |
| POST   | `/login`                 | ❌   | JWT login                          |
| GET    | `/profile/:id`           | ✅   | Get full candidate profile         |
| PUT    | `/profile/:id`           | ✅   | Update profile                     |
| POST   | `/upload-resume/:id`     | ✅   | Upload PDF + auto-parse skills     |

### Register Candidate
```http
POST /api/candidates/register
Content-Type: application/json

{
  "fullName": "Arjun Sharma",
  "email": "arjun@example.com",
  "password": "Password@123",
  "phone": "9876543210",
  "socialCategory": "General",
  "districtType": "Urban"
}
```

### Login
```http
POST /api/candidates/login
Content-Type: application/json

{
  "email": "arjun.sharma@example.com",
  "password": "Password@123"
}
```

Returns: `{ token, candidate }`

### Upload Resume
```http
POST /api/candidates/upload-resume/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

resume: <PDF file>
```

Returns: `{ parsedSkills: [...], resumeUrl }`

---

## 🤖 ML Service API

| Method | Route             | Description                            |
|--------|-------------------|----------------------------------------|
| GET    | `/health`         | Health check                           |
| POST   | `/match`          | Match candidate to internships         |
| POST   | `/batch-match`    | Batch match all candidates             |
| POST   | `/quota-summary`  | Quota compliance analytics             |

### Match Request
```http
POST http://localhost:8000/match
Content-Type: application/json

{
  "candidate": {
    "fullName": "Arjun Sharma",
    "skills": ["Python", "Data Analysis"],
    "sectorInterest": ["Technology"],
    "socialCategory": "General",
    "districtType": "Urban",
    "locationPreference": { "state": "Maharashtra", "willingToRelocate": true }
  }
}
```

---

## 👥 Seed Data Credentials (Demo)

All seed candidates use password: `Password@123`

| Name              | Email                        | Category | District      |
|-------------------|------------------------------|----------|---------------|
| Arjun Sharma      | arjun.sharma@example.com     | General  | Urban         |
| Priya Devi        | priya.devi@example.com       | OBC      | Urban         |
| Ramesh Kumar Meena| ramesh.meena@example.com     | ST       | Aspirational  |
| Sunita Kumari     | sunita.kumari@example.com    | SC       | Urban         |
| Mohammed Faraz    | faraz.m@example.com          | OBC      | Urban         |
| Lakshmi Bai Sahu  | lakshmi.sahu@example.com     | OBC      | Rural         |
| Vivek Nair        | vivek.nair@example.com       | General  | Urban         |
| Ankita Murmu      | ankita.murmu@example.com     | ST       | Aspirational  |
| Deepak Chauhan    | deepak.chauhan@example.com   | SC       | Rural         |
| Meenakshi Rajan   | meenakshi.rajan@example.com  | General  | Urban         |

---

## 🏗️ Step 02 (Upcoming)

Next module will include:
- Company registration & internship posting
- Company dashboard
- Admin dashboard with quota monitoring
- Full AI matching integration
- Recharts analytics for quota compliance visualization

---

## 📁 Key Files Reference

```
backend/
  server.js                  → Express app entry point
  models/Candidate.js        → Mongoose schema with virtuals
  routes/candidateRoutes.js  → All 5 candidate API routes
  middleware/authMiddleware.js → JWT protect + token generator
  middleware/uploadMiddleware.js → Multer PDF config
  utils/resumeParser.js      → pdf-parse + NLP skill extractor
  seed.js                    → DB seeder

frontend/src/
  App.js                     → Router + auth wrapper
  context/AuthContext.js     → Global auth state (Context API)
  utils/api.js               → Axios API calls
  components/auth/
    RegisterPage.js          → 3-step registration form
    LoginPage.js             → JWT login page
  components/candidate/
    Navbar.js                → Responsive navbar
    LandingPage.js           → Public landing page
  components/dashboard/
    Dashboard.js             → Candidate dashboard
    EditProfileModal.js      → Profile edit slide-over

ml-service/
  app.py                     → Flask AI matching engine

seed-data/
  candidates.json            → 10 sample candidates
```

---

## 🎨 UI Design

- **Color Scheme:** Government Blue (#1d4ed8) + White + Saffron accent
- **Font:** IBM Plex Sans (clean, government-grade)
- **Mobile-first** responsive design
- **Tricolor stripe** header element
- Accessibility-first form labels and ARIA patterns
