# 🌐 Cloud Database Setup Guide (No Local Installation Required)

This guide helps you set up FREE cloud databases for development/testing.

## Option A: Supabase (PostgreSQL) - FREE

### Step 1: Create Supabase Account
1. Go to https://supabase.com/
2. Sign up with GitHub/Google
3. Click "New Project"

### Step 2: Configure Project
- **Name**: ahava-healthcare
- **Database Password**: Create a strong password (save it!)
- **Region**: Choose closest to South Africa (eu-west-1 or similar)
- **Pricing Plan**: Free

### Step 3: Get Connection String
1. Go to Project Settings → Database
2. Copy the "Connection string" under "Connection pooling"
3. Format: `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres`

### Step 4: Update Backend .env
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:6543/postgres"
```

**Benefits**: 
- ✅ 500MB storage (free tier)
- ✅ Built-in backups
- ✅ Dashboard for data viewing
- ✅ Auto-scaling

---

## Option B: Neon (PostgreSQL) - FREE

### Step 1: Create Account
1. Go to https://neon.tech/
2. Sign up with GitHub/Google
3. Create new project

### Step 2: Get Connection String
1. Copy the connection string from dashboard
2. Format: `postgresql://[user]:[password]@[host]/[database]`

### Step 3: Update Backend .env
```env
DATABASE_URL="your_neon_connection_string"
```

**Benefits**:
- ✅ 3GB storage (free tier)
- ✅ Serverless (scales to zero when not used)
- ✅ Instant branching

---

## Option C: Upstash (Redis) - FREE

### Step 1: Create Account
1. Go to https://upstash.com/
2. Sign up with GitHub/Google
3. Create Redis Database

### Step 2: Configure
- **Name**: ahava-redis
- **Region**: Choose closest region
- **Type**: Pay as you go (FREE tier: 10K commands/day)

### Step 3: Get Connection Details
1. Copy the "REST URL" or "Redis URL"
2. Format: `redis://default:[PASSWORD]@[HOST]:[PORT]`

### Step 4: Update Backend .env
```env
REDIS_URL="redis://default:YOUR_PASSWORD@us1-happy-shark-12345.upstash.io:6379"
```

**Benefits**:
- ✅ 10,000 commands/day (free)
- ✅ Serverless
- ✅ Global replication
- ✅ Built-in REST API

---

## Option D: Redis Labs - FREE

### Step 1: Create Account
1. Go to https://redis.com/try-free/
2. Sign up and create subscription
3. Create database

### Step 2: Get Connection
1. Copy endpoint and password
2. Format connection string

### Step 3: Update .env
```env
REDIS_URL="redis://:[PASSWORD]@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345"
```

---

## 🚀 Complete Setup (Using Cloud Databases)

### Full .env Configuration

```env
# Cloud PostgreSQL (Supabase/Neon)
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[database]"

# Cloud Redis (Upstash/Redis Labs)
REDIS_URL="redis://default:[password]@[host]:6379"

# Rest of configuration (already set)
JWT_SECRET="OIRaC71HU5nYW3sF0QL8burViyJojqcN"
ENCRYPTION_KEY="27q+InwHvCtaz02y4Az09Nqko3knxxlPpW4paIG/MTU="
ENCRYPTION_IV_SALT="d940800855512c8fccd9d9d764a277df"
PORT=4000
NODE_ENV="development"
TIMEZONE="Africa/Johannesburg"
```

### After Updating .env

```powershell
# Run migrations
cd apps\backend
npx prisma generate
npx prisma migrate deploy

# Test connection
npm run dev
```

---

## 📊 Comparison

| Service | Storage | Commands/Day | Latency | Best For |
|---------|---------|--------------|---------|----------|
| **Supabase** | 500MB | Unlimited | Low | Development |
| **Neon** | 3GB | Unlimited | Low | Development |
| **Upstash** | Varies | 10,000 | Low-Medium | Redis only |
| **Redis Labs** | 30MB | Unlimited | Low | Redis only |

---

## ✅ Recommended Setup

**For Quick Start (Best)**:
- PostgreSQL: **Supabase** (easiest dashboard, 500MB free)
- Redis: **Upstash** (generous free tier, serverless)

**Total Time**: 10-15 minutes  
**Total Cost**: $0 (FREE)

---

## 🆘 Need Help?

After setting up cloud databases:
1. Update `apps/backend/.env` with your connection strings
2. Run `npx prisma generate`
3. Run `npx prisma migrate deploy`
4. Start backend: `npm run dev`

Your platform will be running in minutes! 🚀


