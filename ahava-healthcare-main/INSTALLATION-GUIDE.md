# 📦 Installation & Deployment Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 20.0.0 ([Download](https://nodejs.org/))
- **npm** or **yarn**: >= 4.0.0
- **PostgreSQL**: >= 15 ([Download](https://www.postgresql.org/download/))
- **Redis**: >= 7 ([Download](https://redis.io/download))
- **Git**: Latest version

## Quick Installation (Development)

### 1. Install Dependencies

Since npm is not in your PATH, you have two options:

#### Option A: Add Node.js to PATH (Recommended)

1. Find your Node.js installation directory (usually `C:\Program Files\nodejs`)
2. Add it to your system PATH:
   - Press `Win + X` → System
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find and edit "Path"
   - Add `C:\Program Files\nodejs` (adjust path if different)
   - Click OK and restart PowerShell

#### Option B: Use Full Path

```powershell
# Use the full path to npm
& "C:\Program Files\nodejs\npm.cmd" install
```

### 2. Install Project Dependencies

```powershell
# Navigate to project root
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main

# Install root dependencies (if using yarn workspaces)
npm install

# Install backend dependencies
cd apps\backend
npm install
```

### 3. Set Up Environment Variables

The backend already has an `env.example` file. Create a `.env` file:

```powershell
# Copy the example file
Copy-Item apps\backend\env.example apps\backend\.env
```

**Important**: Update the `.env` file with secure values:

```env
# Database
DATABASE_URL="postgresql://ahava_user:ahava_dev_password@localhost:5432/ahava-healthcare?schema=public"

# JWT & Auth - CHANGE THESE!
JWT_SECRET="YOUR-STRONG-32-CHARACTER-SECRET-KEY-HERE-CHANGE-THIS"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Encryption - GENERATE NEW KEYS!
ENCRYPTION_KEY="YOUR-BASE64-ENCODED-32-BYTE-KEY-CHANGE-THIS"
ENCRYPTION_IV_SALT="hex-encoded-16-byte-salt"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
PORT=4000
NODE_ENV="development"
TIMEZONE="Africa/Johannesburg"

# Logging
LOG_DIR="./logs"
```

### 4. Generate Secure Keys

Run this PowerShell script to generate secure keys:

```powershell
# Generate JWT Secret (32 characters)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generate Encryption Key (32 bytes, base64)
$bytes = New-Object byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Generate IV Salt (16 bytes, hex)
$bytes = New-Object byte[] 16
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
($bytes | ForEach-Object { $_.ToString("x2") }) -join ''
```

Copy the output and update your `.env` file.

### 5. Set Up Database

#### Install PostgreSQL (if not installed)

```powershell
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql

# Start PostgreSQL service
Start-Service postgresql-x64-15
```

#### Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql prompt:
CREATE DATABASE "ahava-healthcare";
CREATE USER ahava_user WITH ENCRYPTED PASSWORD 'ahava_dev_password';
GRANT ALL PRIVILEGES ON DATABASE "ahava-healthcare" TO ahava_user;
ALTER USER ahava_user CREATEDB;
\q

# Grant schema permissions
psql -U postgres -d ahava-healthcare -c "GRANT ALL ON SCHEMA public TO ahava_user;"
```

### 6. Set Up Redis

#### Install Redis (Windows)

Redis doesn't officially support Windows, but you can use:

1. **WSL (Windows Subsystem for Linux)** - Recommended
```bash
wsl --install
# After restart:
wsl
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

2. **Memurai** (Redis-compatible for Windows)
```powershell
# Download from https://www.memurai.com/
# Or use Chocolatey:
choco install memurai-developer
```

3. **Docker**
```powershell
docker run -d -p 6379:6379 redis:latest
```

### 7. Run Database Migrations

```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 8. Start the Server

```powershell
# Development mode (with hot reload)
npm run dev

# Or production build
npm run build
npm start
```

### 9. Verify Installation

Open another PowerShell window and test:

```powershell
# Test health endpoint
curl http://localhost:4000/health

# Expected output:
# {"status":"ok","timestamp":"2025-10-09T...","timezone":"Africa/Johannesburg"}
```

## Testing the Security Fixes

Run through the `TESTING-CHECKLIST.md` file to verify all security fixes:

```powershell
# Test weak password (should fail)
curl -Method Post -Uri http://localhost:4000/api/auth/register `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@test.com","password":"weak","firstName":"Test","lastName":"User","role":"PATIENT"}'

# Test strong password (should succeed)
curl -Method Post -Uri http://localhost:4000/api/auth/register `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test2@test.com","password":"StrongP@ssw0rd123","firstName":"Test","lastName":"User","role":"PATIENT"}'
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All dependencies installed
- [ ] Environment variables set with STRONG secrets
- [ ] Database migrations run
- [ ] Redis configured and running
- [ ] HTTPS configured (via reverse proxy)
- [ ] Logs directory writable
- [ ] Security tests passed

### Deployment Options

#### Option 1: Railway (Recommended)

1. Install Railway CLI:
```powershell
iwr https://railway.app/install.ps1 | iex
```

2. Login and deploy:
```powershell
railway login
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\backend
railway init
railway up
```

3. Add environment variables in Railway dashboard

#### Option 2: Render

1. Push code to GitHub
2. Connect repository in Render dashboard
3. Use `deploy/render/render.yaml` configuration
4. Set environment variables

#### Option 3: Traditional VPS

1. Install Node.js, PostgreSQL, Redis on server
2. Clone repository
3. Install dependencies
4. Run migrations
5. Set up Nginx reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. Set up SSL with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

7. Set up PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "ahava-api" -- start
pm2 save
pm2 startup
```

### Production Environment Variables

Update `.env` for production:

```env
NODE_ENV="production"
DATABASE_URL="postgresql://user:password@prod-host:5432/ahava-healthcare"
REDIS_URL="redis://prod-host:6379"
JWT_SECRET="<STRONG-PRODUCTION-SECRET-CHANGE-THIS>"
ENCRYPTION_KEY="<STRONG-PRODUCTION-KEY-CHANGE-THIS>"

# Logging
LOG_DIR="/var/log/ahava-healthcare"

# CORS (update with your domains)
CORS_ORIGIN="https://admin.yourdomain.com,https://doctor.yourdomain.com"
```

### Post-Deployment Verification

1. **Health Check**:
```powershell
curl https://your-domain.com/health
```

2. **Security Headers**:
```powershell
curl -I https://your-domain.com/api/auth/csrf-token
# Check for: X-Frame-Options, X-Content-Type-Options, etc.
```

3. **Rate Limiting**:
```powershell
# Try 6 registration attempts (should be blocked)
```

4. **Logging**:
```powershell
# Check logs are being written
ls /var/log/ahava-healthcare/
```

5. **Database Connection**:
```powershell
# Verify migrations are applied
npx prisma migrate status
```

## Troubleshooting

### Issue: "npm is not recognized"

**Solution**: Add Node.js to PATH or use full path:
```powershell
$env:Path += ";C:\Program Files\nodejs"
```

### Issue: Database connection failed

**Solution**: Check PostgreSQL service is running:
```powershell
Get-Service postgresql*
# If stopped:
Start-Service postgresql-x64-15
```

### Issue: Redis connection failed

**Solution**: 
- WSL: `wsl sudo service redis-server start`
- Memurai: Check Windows Services
- Docker: `docker ps` to verify container is running

### Issue: Port 4000 already in use

**Solution**: Find and kill the process:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process
```

### Issue: Prisma migrations fail

**Solution**: Reset and re-run:
```powershell
npx prisma migrate reset --force
npx prisma migrate dev
```

### Issue: TypeScript compilation errors

**Solution**: Clean and rebuild:
```powershell
Remove-Item -Recurse -Force node_modules, dist
npm install
npm run build
```

## Monitoring & Maintenance

### Log Rotation

Set up Windows Task Scheduler to rotate logs:

```powershell
# Create rotation script: rotate-logs.ps1
$logDir = "C:\path\to\logs"
$daysToKeep = 30
Get-ChildItem $logDir -Filter "app-*.log" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$daysToKeep) } | 
    Remove-Item
```

Schedule it to run daily.

### Automated Backups

```powershell
# Database backup script
$date = Get-Date -Format "yyyy-MM-dd"
pg_dump -U ahava_user ahava-healthcare > "backup-$date.sql"
```

### Health Monitoring

Set up a monitoring service to check:
- `/health` endpoint every 5 minutes
- Log error rates
- Database connection status
- Redis connection status

## Next Steps

1. ✅ Installation complete
2. ✅ Security fixes tested
3. ⏭️ Complete Week 3-4 development:
   - Payment processing
   - Real-time messaging
   - File uploads
   - Webhook implementations

## Support

For issues or questions:
- Review `TESTING-CHECKLIST.md`
- Check `docs/SECURITY.md`
- Review `docs/DEVELOPMENT.md`

---

**Last Updated**: October 9, 2025  
**Version**: 1.0.0


