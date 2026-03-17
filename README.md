# StuFolio

> **AI-powered student intelligence platform** for colleges — unifying academic performance, coding profiles, attendance, career readiness, and mentor oversight in one place.

![Tech Stack](https://img.shields.io/badge/React-18-blue?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js) ![Prisma](https://img.shields.io/badge/Prisma-ORM-purple?logo=prisma) ![Supabase](https://img.shields.io/badge/Database-Supabase-green?logo=supabase)

---

## Features

### 👨‍🎓 Student
| Feature | Description |
|---|---|
| **Dashboard** | Performance index, CGPA, problems solved (summed across all platforms), day streak from heatmap |
| **Activity Heatmap** | GitHub-style coding activity grid across LeetCode, Codeforces & other platforms |
| **Growth Charts** | CGPA trend across semesters; coding vs academic performance chart |
| **Leaderboard** | Ranked by performance, CGPA, coding stats, and consistency |
| **AI Analysis** | Gemini-powered personalized insights, weakness identification, study suggestions |
| **Attendance Tracker** | Subject-wise attendance with eligibility status & safe-miss predictor |
| **Academic Records** | Semester-wise marks, GPA, and subject breakdown |
| **Career & Skills** | Placement readiness score, skill gap analysis, certification paths |
| **Smart Calendar** | Contest alerts, exam dates, assignment deadlines |
| **Settings** | Link LeetCode/Codeforces/GitHub profiles; manage account details |

### 🧑‍🏫 Mentor
| Feature | Description |
|---|---|
| **Mentor Dashboard** | Batch overview — average CGPA, at-risk students, coding activity |
| **Student List** | Search, filter, and view all assigned students |
| **Student Detail** | Per-student deep-dive: academics, coding, attendance, AI insights |
| **Daily Attendance** | Mark attendance with calendar date picker |
| **Academic Records** | View and manage semester marks for all students |
| **Analytics** | Batch-level charts — GPA distribution, coding vs academic correlation |

### 🔐 Auth
- Microsoft SSO (Azure MSAL) — college email sign-in
- JWT session backed by Supabase PostgreSQL
- Role-based routes: `STUDENT` vs `MENTOR`
- Smart root redirect: authenticated users go directly to their dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL on **Supabase** |
| **Auth** | Azure MSAL (Microsoft SSO) + JWT |
| **AI** | Google Gemini API |
| **Deployment** | Frontend → **Vercel** · Backend → **Render** |
| **Fonts** | Caveat (headings), Inter (body) |

---

## Project Structure

```
StuFolio/
├── frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── pages/          # Route-level pages (Student, Mentor, Landing, etc.)
│   │   ├── components/     # Shared UI (DashboardLayout, ProtectedRoute, etc.)
│   │   ├── contexts/       # AuthContext
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # API client
│   └── tailwind.config.ts
│
├── backend/                # Express REST API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic (coding profile sync, AI, etc.)
│   │   ├── middleware/     # Auth, error handling
│   │   └── lib/            # Prisma client, utilities
│   └── prisma/
│       └── schema.prisma   # Database schema
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (PostgreSQL)
- A `.env` file in `backend/` (see below — **do not commit this**)

### 1. Clone

```bash
git clone https://github.com/Nakul9565/StuFolio.git
cd StuFolio
```

### 2. Backend setup

```bash
cd backend
npm install
npx prisma generate       # Generate Prisma client
npx prisma db push        # Push schema to database
npm run seed              # Seed demo data (optional)
npm run dev               # Start API on http://localhost:3001
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev               # Start dev server on http://localhost:8080
```

---

## Environment Variables

Create `backend/.env` (never commit this file):

```env
# Database (Supabase)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"

# Server
PORT=3001

# Microsoft SSO (Azure)
MSAL_CLIENT_ID=your-azure-app-client-id
MSAL_TENANT_ID=your-azure-tenant-id

# AI
GEMINI_API_KEY=your-google-gemini-api-key

# Email notifications (Gmail App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

> ⚠️ If you are a collaborator, ask the repo owner to share the `.env` file privately (WhatsApp, Discord, etc.). Never share it in a commit or pull request.

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Health check |
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login → JWT |
| POST | `/api/auth/msal-login` | — | Microsoft SSO login |
| GET | `/api/students/me` | Student | Dashboard data |
| GET | `/api/students/me/profile` | Student | Full profile |
| GET | `/api/students/me/attendance` | Student | Attendance records |
| GET | `/api/students/me/academics` | Student | Academic marks |
| GET | `/api/students/:id` | Mentor | Student detail |
| GET | `/api/mentor/dashboard` | Mentor | Class overview |
| GET | `/api/mentor/students` | Mentor | Student list |
| GET | `/api/mentor/analytics` | Mentor | Batch analytics |
| GET/POST | `/api/mentor/attendance` | Mentor | Mark attendance |
| GET | `/api/leaderboard` | Any | Ranked students |
| GET | `/api/events` | Any | Calendar events |
| POST | `/api/events` | Mentor | Create event |
| GET | `/api/notifications` | Any | User notifications |
| GET | `/api/analysis` | Student | AI analysis |

---

## License

MIT
