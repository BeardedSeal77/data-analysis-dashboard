# Task Management — API and UI

Task tracking layer for milestones, tasks, members, and assignments.

## Overview

- Backend: Flask API in `01_TaskManagement/api/` (MongoDB Atlas)
- Frontend: Next.js pages in `app/task-management`
- Data seeds/snapshots: `01_TaskManagement/data/`
- Concept & GitHub Pages approach: `01_TaskManagement/public/setup.md`

## Configure Secrets

Create `secrets.txt` at the repository root with:

```
# MongoDB Atlas connection
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
DATABASE_NAME=hdpsa_tasks

# Ports (optional)
TASK_MANAGEMENT_PORT=5000
PROJECT_API_PORT=5001
```

## Install & Run (API)

1) Create venv and install requirements:
```
python -m venv 01_TaskManagement/api/venv
01_TaskManagement\api\venv\Scripts\pip install -r 01_TaskManagement\api\requirements.txt
```

2) Start API (default `http://localhost:5000`):
```
cd 01_TaskManagement/api
venv\Scripts\python.exe app.py
```

## Key Endpoints

- Health: `GET /api/health`
- Tasks: `GET /api/tasks`, `GET /api/tasks/milestone/{id}`, `POST /api/tasks`, `PUT /api/tasks/{id}`
- Assignment: `POST /api/tasks/{id}/assign`, `POST /api/tasks/assignments/{assignmentId}/complete`
- Members: `GET /api/members`, `GET /api/members/{id}`
- Milestones: `GET /api/milestones`, `GET /api/milestones/{id}/progress`
- Analytics: `GET /api/analytics/dashboard` (see `app/task-management/services/api.ts` for usage)

## Frontend (Dashboard)

- UI entry: `app/task-management/page.tsx`
- Service config: `app/task-management/services/api.ts` (base URL `http://localhost:5000/api`)
- Start the UI with `npm run next-dev` then open `http://localhost:3000/task-management`

