Quick start deployment guide

Goal: bring the platform up locally in roughly thirty minutes, then prepare a staging deployment. Start services from the project root:
```
cd ahava-healthcare-main
docker-compose up -d
```
Confirm PostgreSQL and Redis containers are running with `docker ps`.

Configure the backend by copying `env.example` to `.env` inside `apps/backend` and populating the essentials:
```
cp env.example .env
# DATABASE_URL="postgresql://ahava_user:ahava_dev_password@localhost:5432/ahava-healthcare"
# REDIS_URL="redis://localhost:6379"
# JWT_SECRET="dev-secret-key-change-in-production-32chars"
# ENCRYPTION_KEY="dev-encryption-key-base64-32bytes"
# ENCRYPTION_IV_SALT="dev-salt-hex-16bytes"
```
Generate secrets with Node’s crypto helpers if needed:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Set up the database:
```
yarn prisma:generate
yarn prisma:migrate
yarn prisma:seed
```
Start the backend:
```
yarn dev
```
Expect “Server running on http://localhost:4000.” Verify with http://localhost:4000/health.

Launch the frontends in separate terminals:
```
cd apps/admin && yarn dev        # http://localhost:3000
cd ../doctor && yarn dev         # http://localhost:3001
cd ../patient && yarn start      # http://localhost:3002
cd ../nurse && yarn start        # http://localhost:3003
```
Log in using seeded credentials (`admin@ahava.com`, `doctor@ahava.com`, `nurse@ahava.com`, `patient@ahava.com` with `Test@123456789`) and confirm each portal authenticates.

For a fast Railway staging deploy, either use the dashboard (create project, connect GitHub, point to `apps/backend`, add PostgreSQL and Redis, set environment variables, deploy, run `yarn prisma migrate deploy`/`yarn prisma:seed`, repeat for frontends with `NEXT_PUBLIC_API_URL`) or the CLI:
```
npm i -g @railway/cli
railway login
railway init
railway link
railway add postgresql
railway add redis
railway variables set JWT_SECRET="your-secret"
railway variables set ENCRYPTION_KEY="your-key"
# set remaining vars
railway up
```
Essential environment variables:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET="your-32-character-secret"
ENCRYPTION_KEY="base64-32-byte-key"
ENCRYPTION_IV_SALT="hex-16-byte-salt"
NODE_ENV="production"
PORT=4000
PAYSTACK_SECRET_KEY="sk_test_..." (optional)
PAYSTACK_PUBLIC_KEY="pk_test_..." (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

Verification checklist (local): Docker containers running, backend launches cleanly, `/health` returns ok, logins succeed, database seeded. Verification checklist (staging): backend responds, migrations applied, frontends reachable, authentication works.

Reference material: `QUICK-TESTING-GUIDE.md` for a fifteen-minute manual walkthrough, `GO-LIVE-CHECKLIST.md` for production readiness, `DEPLOYMENT-ROADMAP.md` for a deeper plan, `README.md` for architecture context, and `MESSAGING-TESTING-GUIDE.md` for real-time validation.

Guide prepared by Mpho Thwala on behalf of Ahava on 88 Company.
