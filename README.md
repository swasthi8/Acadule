# Acadule

Acadule is a timetable management foundation for PU colleges and competitive-exam coaching institutes. This phase contains the Next.js application shell, Prisma data model, Auth.js credentials foundation, migrations, and realistic demo seed data.

## Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop, or a PostgreSQL 16 database

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start PostgreSQL locally with Docker:

   ```bash
   docker compose up -d postgres
   ```

3. Create the environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

   Replace `AUTH_SECRET` with a long random value.

4. Generate the Prisma client and apply migrations:

   ```bash
   npm run db:generate
   npm run db:deploy
   ```

5. Seed demo data:

   ```bash
   npm run db:seed
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

Open http://localhost:3000.

## Demo accounts

All seeded accounts use the password `AcaduleDemo123!`:

- Admin: `admin@acadule.test`
- Teacher: `arjun@acadule.test`
- Student: `student@acadule.test`

Change demo passwords before using the application outside local development.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
npx prisma validate
```

The broader teacher and student dashboards remain outside this phase; the admin timetable generation and publication workflow is implemented below.

## Timetable solver

Phase 3 adds a FastAPI and OR-Tools CP-SAT solver under `solver/`. Install its pinned dependencies in the workspace environment:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r solver\requirements.txt
```

Run the HTTP solver when you want to use a separate local service:

```powershell
.venv\Scripts\python.exe -m uvicorn solver.main:app --host 127.0.0.1 --port 8000
```

The Next.js generation route invokes the same solver through a local subprocess by default. Set `SOLVER_URL=http://127.0.0.1:8000` to make it call the FastAPI `/solve` endpoint instead. Generated schedules are saved as drafts and must be validated before publication.
