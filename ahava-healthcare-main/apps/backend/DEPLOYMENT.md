# Ahava Healthcare Backend - Deployment Guide

This guide walks you through deploying the Ahava Healthcare backend API and worker processes using Docker.

## Prerequisites

- Docker Desktop installed and running
- Production database credentials (PostgreSQL)
- Paystack live API keys
- SMTP credentials for email notifications
- Expo access token for push notifications

## Quick Start

### 1. Configure Environment Variables

Copy the example environment file and fill in your production values:

```bash
cd apps/backend
cp .env.production.example .env.production
```

Edit `.env.production` with your real credentials:
- `DATABASE_URL` - Production PostgreSQL connection
- `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` - Live Paystack keys
- `PAYSTACK_WEBHOOK_SECRET` - From Paystack webhook settings
- `JWT_SECRET` - Strong random string (32+ chars)
- `ENCRYPTION_KEY` / `ENCRYPTION_IV_SALT` - Generated secure keys
- `SMTP_*` - Email provider credentials
- `EXPO_ACCESS_TOKEN` - Expo push notification token

**Important:** Never commit `.env.production` to version control!

### 2. Run Database Migrations

Before starting the API, ensure your production database schema is up to date:

```bash
# Option A: Run migration from your local machine
cd apps/backend
npx prisma migrate deploy

# Option B: Run migration inside a temporary container
docker run --rm \
  --env-file .env.production \
  -v $(pwd)/prisma:/app/prisma \
  node:20-alpine sh -c "npm install -g prisma && prisma migrate deploy"
```

**⚠️ Important:** Always backup your production database before running migrations!

### 3. Build and Start Services

From the `apps/backend` directory:

```bash
# Build and start all services (API, Worker, Postgres, Redis)
docker compose up -d --build

# View logs
docker compose logs -f

# Check service status
docker compose ps
```

This will start:
- **API** on port 4000 (or `PORT` from `.env.production`)
- **Worker** process for background jobs (email, PDF, push)
- **PostgreSQL** on port 5432
- **Redis** on port 6379

### 4. Verify Deployment

Check that services are healthy:

```bash
# Health check
curl http://localhost:4000/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-20T...","timezone":"Africa/Johannesburg"}
```

View container logs:

```bash
# API logs
docker compose logs -f api

# Worker logs
docker compose logs -f worker

# All logs
docker compose logs -f
```

## Production Checklist

Before going live, verify:

- [ ] All environment variables in `.env.production` are set with real values
- [ ] Database migrations have been applied (`prisma migrate deploy`)
- [ ] Paystack webhook URL is configured: `https://your-api-domain.com/webhooks/paystack`
- [ ] CORS origins in `src/index.ts` include your production frontend URLs
- [ ] SSL/HTTPS is configured (via reverse proxy like nginx or cloud load balancer)
- [ ] Database backups are enabled
- [ ] Log aggregation is configured (CloudWatch, Logtail, etc.)
- [ ] Monitoring/alerting is set up for API health and webhook failures

## Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart a specific service
docker compose restart api

# View logs
docker compose logs -f api

# Rebuild after code changes
docker compose up -d --build

# Run database migration
docker compose exec api npx prisma migrate deploy

# Access database shell
docker compose exec postgres psql -U ahava_user -d ahava-healthcare

# Access Redis CLI
docker compose exec redis redis-cli -a ahava_redis_pass
```

## Troubleshooting

### API won't start
- Check logs: `docker compose logs api`
- Verify environment variables: `docker compose exec api env | grep DATABASE_URL`
- Ensure Postgres and Redis are healthy: `docker compose ps`

### Database connection errors
- Verify `DATABASE_URL` in `.env.production` is correct
- Check Postgres container is running: `docker compose ps postgres`
- Test connection: `docker compose exec postgres pg_isready -U ahava_user`

### Worker not processing jobs
- Check worker logs: `docker compose logs -f worker`
- Verify Redis connection: `docker compose exec redis redis-cli -a ahava_redis_pass ping`
- Ensure API is running (worker depends on API)

### Webhook events not being stored
- Check API logs for webhook processing errors
- Verify `PAYSTACK_WEBHOOK_SECRET` matches Paystack dashboard
- Query webhook_events table: `docker compose exec postgres psql -U ahava_user -d ahava-healthcare -c "SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;"`

## Scaling

To run multiple worker instances:

```bash
docker compose up -d --scale worker=3
```

This starts 3 worker containers to process background jobs in parallel.

## Backup & Recovery

### Database Backup
```bash
# Create backup
docker compose exec postgres pg_dump -U ahava_user ahava-healthcare > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose exec -T postgres psql -U ahava_user ahava-healthcare < backup_20251120.sql
```

### Volume Backup
```bash
# Backup volumes
docker run --rm -v ahava-backend_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Security Notes

- Never commit `.env.production` to version control
- Use strong, randomly generated secrets for `JWT_SECRET`, `ENCRYPTION_KEY`
- Enable SSL/TLS in production (use reverse proxy or load balancer)
- Regularly update Docker images: `docker compose pull && docker compose up -d --build`
- Monitor logs for suspicious activity
- Keep database backups encrypted and off-site

## Support

For issues or questions, check:
- API health: `http://your-domain:4000/health`
- Webhook events: Query `webhook_events` table
- Application logs: `docker compose logs -f`

