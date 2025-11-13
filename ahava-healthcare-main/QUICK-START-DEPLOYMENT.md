Quick start deployment guide

Goal: get the platform running locally in about 30 minutes and then push to staging.

Step 1 – start services (≈5 minutes). From the project root run:
```
cd ahava-healthcare-main
docker-compose up -d
```
Check `docker ps` to ensure PostgreSQL and Redis are active.

Step 2 – configure the backend (≈5 minutes). At `apps/backend` copy the environment template and set minimum values:
```
cp env.example .env
# edit .env with:
# DATABASE_URL="postgresql://ahava_user:ahava_dev_password@localhost:5432/ahava-healthcare"
# REDIS_URL="redis://localhost:6379"
# JWT_SECRET="dev-secret-key-change-in-production-32chars"
# ENCRYPTION_KEY="dev-encryption-key-base64-32bytes"
# ENCRYPTION_IV_SALT="dev-salt-hex-16bytes"
```
Generate secrets quickly by running:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Step 3 – set up the database (≈5 minutes):
```
yarn prisma:generate
yarn prisma:migrate
yarn prisma:seed
```

Step 4 – start the backend (≈2 minutes):
```
yarn dev
```
Expect “Server running on http://localhost:4000.” Hit http://localhost:4000/health to confirm `{"status":"ok"}`.

Step 5 – launch frontends (≈10 minutes). In separate terminals:
```
cd apps/admin && yarn dev        # http://localhost:3000
cd ../doctor && yarn dev         # http://localhost:3001
cd ../patient && yarn start      # http://localhost:3002
cd ../nurse && yarn start        # http://localhost:3003
```

Step 6 – verify logins (≈3 minutes). Use seeded credentials (`admin@ahava.com`, `doctor@ahava.com`, `nurse@ahava.com`, `patient@ahava.com` with `Test@123456789`) and confirm each portal authenticates.

Deploying to staging quickly on Railway:

Option 1 – Railway dashboard. Create a new project at https://railway.app, connect the GitHub repo, set `apps/backend` as root, add PostgreSQL and Redis (Railway generates connection strings), configure environment variables, deploy, run `yarn prisma migrate deploy` and `yarn prisma:seed` in Railway’s logs/CLI, then repeat for each frontend (setting `NEXT_PUBLIC_API_URL`).

Option 2 – Railway CLI:
```
npm i -g @railway/cli
railway login
railway init
railway link
railway add postgresql
railway add redis
railway variables set JWT_SECRET="your-secret"
railway variables set ENCRYPTION_KEY="your-key"
# set remaining vars	railway up
```
Required environment variables:
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

Verification checklist – local: Docker containers running, backend starts cleanly, health endpoint at `/health`, logins succeed, database seeded. Verification checklist – staging: backend deployed and responds, migrations applied, frontends reachable, authentication works.

Helpful notes: see `QUICK-TESTING-GUIDE.md` for a 15-minute manual walkthrough, `GO-LIVE-CHECKLIST.md` for production readiness, `DEPLOYMENT-ROADMAP.md` for a detailed plan, `README.md` for architecture overview, and `MESSAGING-TESTING-GUIDE.md` for real-time feature validation.

Guide written by Mpho Thwala on behalf of Ahava on 88 Company.

