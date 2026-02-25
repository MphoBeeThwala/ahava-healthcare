# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

Ahava Healthcare is a Yarn 4.3.1 (Berry via Corepack) monorepo. See `docs/DEVELOPMENT.md` for the full dev setup guide, and `package.json` scripts for standard commands (dev, lint, test, type-check, etc.).

**Services:**

| Service | Directory | Port | Command |
|---|---|---|---|
| Backend API | `apps/backend/` | 4000 | `yarn dev:api` |
| Frontend (Vite+React) | `frontend/` | 5173 | `cd frontend && yarn dev` |

The frontend is a standalone project (not in the Yarn workspace). It has its own `yarn.lock` and must be installed separately with `cd frontend && yarn install`.

### System dependencies (pre-installed in snapshot)

- PostgreSQL 16 — start with `sudo pg_ctlcluster 16 main start`
- Redis 7 — start with `sudo redis-server --daemonize yes`

### Database

- DB name: `ahava-healthcare`, user: `ahava_user`, password: `ahava_dev_password`
- Connection string is in `apps/backend/.env` (not committed; create from `deploy/env/backend.env.example` and `docs/DEVELOPMENT.md`)
- Run migrations: `yarn prisma:migrate`
- Generate Prisma client: `yarn prisma:generate` (ignore the false-positive "could not resolve @prisma/client" error — it works fine under Yarn Berry)

### Gotchas

- **Queue init order:** `apps/backend/src/services/queue.ts` was fixed to lazily create BullMQ queues inside `initializeQueue()`. The original code called `getRedis()` at module level before Redis was initialized, which crashed on startup.
- **Frontend API URL:** `frontend/src/api.ts` defaults `API_BASE_URL` to `http://localhost:3000`, but the backend runs on port 4000. Set `VITE_API_URL=http://localhost:4000/api` when running the frontend if you need API calls to work.
- **Auth rate limiter:** The `/api/auth/*` endpoints are rate-limited to 5 requests per 15 minutes per IP. During development/testing, this can be quickly exhausted.
- **ESLint:** Both backend (`apps/backend/.eslintrc.json`) and frontend (`frontend/.eslintrc.json`) have configs. `yarn lint` runs the backend lint. `cd frontend && yarn lint` runs the frontend lint. Both pass with 0 errors.
- **Tests:** `yarn test:backend` runs 28 Jest tests (health, auth, encryption). Tests mock Prisma and the rate limiter. A separate `tsconfig.test.json` includes test files with Jest types.
- **TypeScript type-check:** `yarn type-check` passes clean. `noImplicitReturns` is set to `false` (standard for Express).
