# Disaster & Flood Relief Management System

A full-stack relief-coordination app.

| Folder | What | Stack |
|---|---|---|
| [`backend/`](backend) | REST API, JWT auth, role-based access, Neon Postgres | Java 17, Spring Boot 3, Spring Security, JPA |
| [`frontend/`](frontend) | Citizen and admin web UI | React 19, Vite, React Router, Leaflet |

The frontend talks to the backend over HTTP. There is no mock data: everything (disasters, requests, resources, relief centers, volunteers, notifications, users) is stored in the database.

## Run it locally

### 1. Backend (port 8080)

Needs JDK 17+ and Maven. Copy `backend/.env.example` to `backend/.env` and fill in your Neon details (JDBC URL, see [`backend/README.md`](backend/README.md)). The backend reads that file on every start, so you only do this once. `.env` is git-ignored, so your password stays out of the repo. Then start it:

```bash
cd backend
mvn spring-boot:run
```

Wait for `Started DisasterReliefBackendApplication` in the console before opening the frontend. Variables set in the terminal (`$env:DATABASE_URL = ...`) still work and take priority over the file.

On first start the schema is created automatically and an admin is seeded:
`admin@disasterrelief.local` / `Admin@123` (change it after first login).

### 2. Frontend (port 5173)

Needs Node 20+.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server forwards every `/api` call to the backend at `http://127.0.0.1:8080`, so the browser never contacts port 8080 directly. This also works from a phone or another laptop: open the "Network" address Vite prints. To point the dev server at a different backend, set `BACKEND_URL` in `frontend/.env` (see `frontend/.env.example`).

If a page says "Cannot reach the backend", the backend isn't running or failed to start. Check its console; the usual cause is a missing or wrong `backend/.env`.

## Deploy

Vercel hosts the frontend; it can't run the Java backend, so that goes on Render. The database stays on Neon.

### 1. Backend on Render

1. On [render.com](https://render.com), choose **New → Blueprint** and pick this repository. Render reads [`render.yaml`](render.yaml) and builds [`backend/Dockerfile`](backend/Dockerfile).
2. When asked, paste Neon's connection string into `DATABASE_URL` exactly as Neon shows it (`postgresql://user:password@host/db?sslmode=require`), and choose a `SEED_ADMIN_PASSWORD` for the admin account. `JWT_SECRET` is generated for you.
3. When the deploy finishes, copy the service URL, e.g. `https://disaster-relief-backend.onrender.com`. Opening `<that URL>/api/public/stats` should show some JSON.

The free plan sleeps after 15 minutes without traffic, so the first request after a pause takes about a minute.

### 2. Frontend on Vercel

The Vercel project builds `frontend/` and redeploys on every push to `main`. The site calls `/api` on its own domain, and [`frontend/vercel.json`](frontend/vercel.json) forwards those calls to the backend. To connect a backend, add this rule as the first entry under `rewrites`, with your Render URL, and push:

```json
{ "source": "/api/:path*", "destination": "https://<your-render-service>.onrender.com/api/:path*" }
```

Until that rule exists, the site shows "The backend is not connected to this site yet."

## How the UI maps to the API

The UI uses friendly labels; the backend uses enums. The translation lives in one file, [`frontend/src/services/backend.js`](frontend/src/services/backend.js):

| UI | Backend |
|---|---|
| Role `USER` / `ADMIN` | `CITIZEN` / `ADMIN` |
| Request type "Medical Assistance", "Food & Water Ration", "Evacuation Support", "Shelter Required" | `MEDICAL_HELP`, `FOOD`, `RESCUE`, `SHELTER` |
| Request status Pending / Approved / Rejected / Completed | `SUBMITTED` / `VERIFIED`, `ASSIGNED`, `IN_PROGRESS` / `REJECTED` / `RESOLVED` |
| Priority high / medium / low | `CRITICAL` / `HIGH` / `LOW` |
| Incident status Reported / Active / Critical / Monitoring / Resolved | status + severity (`ACTIVE`+`LOW`, `ACTIVE`+`MEDIUM`, `ACTIVE`+`CRITICAL`, `CONTAINED`, `RESOLVED`) |

## Testing the API on its own

Import [`backend/postman/DisasterRelief.postman_collection.json`](backend/postman/DisasterRelief.postman_collection.json) into Postman. Run the Auth requests first, and tokens and IDs are saved automatically.
