# Disaster & Flood Relief Management System

A full-stack relief-coordination app.

| Folder | What | Stack |
|---|---|---|
| [`backend/`](backend) | REST API, JWT auth, role-based access, Neon Postgres | Java 17, Spring Boot 3, Spring Security, JPA |
| [`frontend/`](frontend) | Citizen and admin web UI | React 19, Vite, React Router, Leaflet |

The frontend talks to the backend over HTTP. There is no mock data: everything (disasters, requests, resources, relief centers, volunteers, notifications, users) is stored in the database.

## Run it locally

### 1. Backend (port 8080)

Needs JDK 17+ and Maven. Set the database variables (Neon JDBC URL, see [`backend/README.md`](backend/README.md)) and start it:

```powershell
$env:DATABASE_URL = "jdbc:postgresql://<neon-host>/<db>?sslmode=require"
$env:DB_USERNAME  = "<neon-username>"
$env:DB_PASSWORD  = "<neon-password>"
$env:JWT_SECRET   = "any-long-random-string-at-least-32-characters"
cd backend
mvn spring-boot:run
```

On first start the schema is created automatically and an admin is seeded:
`admin@disasterrelief.local` / `Admin@123` (change it after first login).

### 2. Frontend (port 5173)

Needs Node 20+.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server forwards every `/api` call to the backend at `http://localhost:8080`, so the browser never contacts port 8080 directly. This also works from a phone or another laptop: open the "Network" address Vite prints. To point the dev server at a different backend, set `BACKEND_URL` in `frontend/.env` (see `frontend/.env.example`).

If a page says "Cannot reach the backend", the backend isn't running or failed to start. Check its console; the usual cause is missing `DATABASE_URL` / `DB_USERNAME` / `DB_PASSWORD` variables, which PowerShell only keeps for the window you set them in.

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
