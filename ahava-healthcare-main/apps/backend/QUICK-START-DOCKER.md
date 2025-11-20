# Quick Start - Docker Deployment

## 🚀 Fastest Path to Running Ahava Backend

### Step 1: Configure Environment (2 minutes)

```powershell
cd apps/backend
copy env.production.example .env.production
```

Edit `.env.production` and fill in your real values:
- `DATABASE_URL` - Your production PostgreSQL
- `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` - Live Paystack keys
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `ENCRYPTION_KEY` - Generate with: `openssl rand -base64 32`
- `ENCRYPTION_IV_SALT` - Generate with: `openssl rand -hex 16`

### Step 2: Run Database Migration (1 minute)

**⚠️ Backup your database first!**

```powershell
# From apps/backend directory
npx prisma migrate deploy
```

This applies the `20251120085706_add_webhook_events` migration to create the webhook_events table.

### Step 3: Start Everything (2 minutes)

```powershell
# Build and start all services
docker compose up -d --build

# Watch logs
docker compose logs -f
```

This starts:
- ✅ API server on port 4000
- ✅ Worker process for background jobs
- ✅ PostgreSQL (if not already running)
- ✅ Redis (if not already running)

### Step 4: Verify It's Working

```powershell
# Check health
curl http://localhost:4000/health

# Should return: {"status":"ok","timestamp":"...","timezone":"Africa/Johannesburg"}

# Check all containers are running
docker compose ps
```

### Common Commands

```powershell
# Stop everything
docker compose down

# Restart just the API
docker compose restart api

# View API logs
docker compose logs -f api

# Rebuild after code changes
docker compose up -d --build
```

### Troubleshooting

**Build fails?**
- Make sure you're in `apps/backend` directory
- Check Docker Desktop is running
- Try: `docker compose build --no-cache`

**API won't start?**
- Check logs: `docker compose logs api`
- Verify `.env.production` has all required variables
- Ensure Postgres and Redis containers are healthy

**Need help?** See `DEPLOYMENT.md` for detailed guide.

