# Ahava Healthcare

A full-stack healthcare platform for South Africa — connecting patients with qualified nurses for home visits, with real-time doctor oversight and an ML-powered early-warning system.

## Overview

- **Patient Portal** — book home healthcare visits, track nurse arrival, view visit history
- **Nurse Operations** — manage active visits, patient communication, real-time location tracking
- **Doctor Oversight** — medical supervision, quality assurance, report review
- **Early Warning (ML)** — patient risk scoring powered by a Python/FastAPI ML service
- **Admin** — system management, analytics, user administration

## Architecture

```
ahava-healthcare/
├── apps/
│   ├── backend/        # Express.js + Prisma API (Railway service: apps/backend)
│   ├── ml-service/     # Python FastAPI ML inference service (Railway service: apps/ml-service)
│   └── worker/         # BullMQ background job processor (Railway service — optional 4th service)
├── workspace/          # Next.js 15 patient-facing web app (Railway root service)
├── android/            # Capacitor Android app (built from repo root)
├── scripts/            # Developer utilities: seeding, smoke tests, load tests
├── migrations/         # Root-level DB migrations (Prisma migrations live in apps/backend/prisma/)
├── deploy/
│   ├── railway/        # Railway project config
│   └── env/            # Per-service .env.example templates
├── railway.toml        # Root Railway service — builds workspace/ via Docker
└── RAILWAY.md          # Railway deployment runbook
```

## Prerequisites

- Node.js >= 20
- Yarn >= 4.0 (`corepack enable`)
- PostgreSQL
- Redis

## Quick Start

```bash
# Clone
git clone https://github.com/MphoBeeThwala/ahava-healthcare.git
cd ahava-healthcare

# Install dependencies (Yarn 4 workspaces)
corepack enable
yarn install

# Copy and fill in environment variables
cp env.example .env
cp apps/backend/env.example apps/backend/.env

# Generate Prisma client and run migrations
yarn prisma:generate
yarn prisma:migrate

# Start all services in parallel
yarn dev
```

## Workspace Commands

```bash
# Development
yarn dev                    # All services in parallel
yarn dev:api               # Backend API only
yarn dev:worker            # Background worker only

# Building
yarn build                 # All workspaces
yarn build:frontend        # Next.js frontend only

# Database
yarn prisma:generate       # Regenerate Prisma client
yarn prisma:migrate        # Run pending migrations (dev)
yarn prisma:seed           # Seed database with base data
yarn seed:mock-patients    # 1,000 synthetic patients (load testing)
yarn seed:from-synthea     # Import from Synthea CSV export
yarn db:reset              # Reset and re-migrate

# Quality
yarn lint                  # Check all workspaces
yarn lint:fix              # Auto-fix lint issues
yarn type-check            # TypeScript across all workspaces
yarn test                  # Run all test suites

# Android / Capacitor
yarn build:capacitor       # Build Capacitor bundle
yarn cap:sync              # Build + sync to android/
```

## Deployment

This project deploys to **Railway** as three services (plus an optional fourth):

| Service | Railway Root Dir | Dockerfile |
|---|---|---|
| Frontend (Next.js) | *(repo root)* | `workspace/Dockerfile` |
| Backend API | `apps/backend` | `apps/backend/Dockerfile` |
| ML Service | `apps/ml-service` | `apps/ml-service/Dockerfile` |
| Worker *(optional)* | *(repo root)* | `apps/worker/Dockerfile` |

See [RAILWAY.md](./RAILWAY.md) for the full deployment runbook and environment variable guide.

## Database Schema

PostgreSQL via Prisma ORM. Main entities: Users (multi-role), Bookings, Visits, Messages, Payments, Reports.

See [`apps/backend/prisma/schema.prisma`](./apps/backend/prisma/schema.prisma) for complete schema.

## Environment Variables

Per-service `.env.example` templates live in [`deploy/env/`](./deploy/env/). Copy them to the appropriate service directory and fill in your values. **Never commit `.env` files.**

## Contributing

```bash
git checkout -b feature/your-feature
# make changes
git commit -m 'feat: describe your change'
git push origin feature/your-feature
# open a pull request
```

## License

MIT — see [LICENSE](LICENSE) for details.

## Support

- Email: support@ahavahealthcare.co.za
- Issues: [GitHub Issues](https://github.com/MphoBeeThwala/ahava-healthcare/issues)

---

*Built for South African healthcare — Timezone: Africa/Johannesburg (SAST) · Currency: ZAR*
