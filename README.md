# StuFolio

A comprehensive student portfolio & analytics platform for colleges — tracking academic performance, coding profiles, attendance, and career readiness.

## Project Structure

```
StuFolio/
├── frontend/    # React + Vite + TypeScript + Tailwind CSS (Vercel)
├── backend/     # Node.js + Express + TypeScript + Prisma + Supabase (Render)
└── README.md
```

## Quick Start

### Backend
```bash
cd backend
npm install
npx prisma db push        # Create database tables
npm run seed               # Populate with demo data
npm run dev                # Start API server on port 3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev                # Start dev server on port 8080
```


## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/students/me` | Student | Dashboard data |
| GET | `/api/students/me/profile` | Student | Full profile |
| GET | `/api/students/me/attendance` | Student | Attendance data |
| GET | `/api/students/me/academics` | Student | Academic records |
| GET | `/api/students/:id` | Mentor | Student detail |
| GET | `/api/mentor/dashboard` | Mentor | Class overview |
| GET | `/api/mentor/students` | Mentor | Student list |
| GET | `/api/mentor/analytics` | Mentor | Batch analytics |
| GET | `/api/leaderboard` | Any | Ranked students |
| GET | `/api/events` | Any | Calendar events |
| POST | `/api/events` | Mentor | Create event |
| GET | `/api/notifications` | Any | User notifications |
| PATCH | `/api/notifications/:id/read` | Any | Mark read |

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui (Deployed on **Vercel**)
- **Backend**: Node.js, Express, TypeScript, Prisma ORM (Deployed on **Render**)
- **Database**: PostgreSQL (**Supabase**)

## License

MIT
