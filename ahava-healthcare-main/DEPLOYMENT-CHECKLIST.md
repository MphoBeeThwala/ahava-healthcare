# 🚀 Production Deployment Checklist

## Pre-Deployment Phase

### Code Quality & Security ✅

- [x] Week 1-2 security fixes completed
- [x] Encryption vulnerability fixed (AES-256-GCM)
- [x] RBAC implemented on admin routes
- [x] Password validation strengthened (12+ chars)
- [x] Account lockout mechanism added
- [x] Rate limiting enhanced
- [x] Input validation implemented
- [x] CSRF protection added
- [x] Structured logging implemented
- [x] Error handling sanitized
- [ ] All TypeScript compilation errors resolved
- [ ] All linting errors resolved
- [ ] Security documentation reviewed

### Dependencies ⚠️

- [ ] All npm packages installed
- [ ] `express-rate-limit` package added
- [ ] No vulnerable dependencies (run `npm audit`)
- [ ] All packages up to date
- [ ] Production dependencies only in production build

### Testing 🧪

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Security tests completed (TESTING-CHECKLIST.md)
- [ ] Manual testing completed
- [ ] Load testing performed
- [ ] Penetration testing completed (optional but recommended)

### Database 🗄️

- [ ] PostgreSQL installed and configured
- [ ] Database created
- [ ] User permissions set correctly
- [ ] All migrations run successfully
- [ ] Database backup strategy defined
- [ ] Connection pooling configured
- [ ] Database encryption enabled (optional)

### Cache & Queue 📦

- [ ] Redis installed and configured
- [ ] Redis persistence enabled
- [ ] BullMQ queues initialized
- [ ] Redis backup strategy defined

## Environment Configuration

### Critical Environment Variables ⚠️

Create production `.env` file with **STRONG** secrets:

```env
# ============================================
# CRITICAL: Change ALL of these values!
# ============================================

# Database
DATABASE_URL="postgresql://user:STRONG_PASSWORD@host:5432/ahava-healthcare"

# Authentication - MUST be strong and unique
JWT_SECRET="GENERATE_STRONG_32_CHAR_SECRET_HERE"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Encryption - MUST be properly generated
ENCRYPTION_KEY="BASE64_ENCODED_32_BYTE_KEY_HERE"
ENCRYPTION_IV_SALT="HEX_ENCODED_16_BYTE_SALT_HERE"

# Redis
REDIS_URL="redis://:password@host:6379"

# Paystack (when ready)
PAYSTACK_SECRET_KEY="sk_live_YOUR_LIVE_KEY"
PAYSTACK_PUBLIC_KEY="pk_live_YOUR_LIVE_KEY"
PAYSTACK_WEBHOOK_SECRET="YOUR_WEBHOOK_SECRET"

# Server
PORT=4000
NODE_ENV="production"
TIMEZONE="Africa/Johannesburg"

# Logging
LOG_DIR="/var/log/ahava-healthcare"

# CORS - Update with your domains
CORS_ORIGIN="https://admin.yourdomain.com,https://doctor.yourdomain.com"

# Email (configure SMTP)
SMTP_HOST="smtp.yourdomain.com"
SMTP_PORT=587
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="SMTP_PASSWORD"
SMTP_FROM="noreply@ahavahealthcare.co.za"
```

### Generate Secure Secrets

**DO NOT use example values in production!**

#### For Linux/macOS:
```bash
# JWT Secret (32 chars)
openssl rand -base64 32

# Encryption Key (32 bytes, base64)
openssl rand -base64 32

# IV Salt (16 bytes, hex)
openssl rand -hex 16
```

#### For Windows PowerShell:
```powershell
# JWT Secret
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Encryption Key
$bytes = New-Object byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# IV Salt
$bytes = New-Object byte[] 16
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
($bytes | ForEach-Object { $_.ToString("x2") }) -join ''
```

## Infrastructure Setup

### Server Requirements

**Minimum Specifications:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 50 GB SSD
- Bandwidth: 100 Mbps

**Recommended Specifications:**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 100 GB SSD
- Bandwidth: 1 Gbps

### HTTPS/SSL Configuration ⚠️ CRITICAL

**Never run production without HTTPS!**

#### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

#### Option 2: Platform SSL (Railway/Render)

These platforms provide automatic SSL. No configuration needed.

### Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/ahava-api

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/ahava-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Process Management (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
cd /var/www/ahava-healthcare/apps/backend
pm2 start npm --name "ahava-api" -- start

# Configure auto-restart on reboot
pm2 startup
pm2 save

# Monitoring
pm2 status
pm2 logs ahava-api
pm2 monit
```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Deny direct access to Node.js port
sudo ufw deny 4000/tcp

# PostgreSQL (only from localhost)
sudo ufw deny 5432/tcp

# Redis (only from localhost)
sudo ufw deny 6379/tcp
```

## Deployment Steps

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Install Nginx
sudo apt install nginx

# Install build tools
sudo apt install build-essential
```

### Step 2: Clone and Build

```bash
# Create deployment directory
sudo mkdir -p /var/www/ahava-healthcare
sudo chown $USER:$USER /var/www/ahava-healthcare

# Clone repository
cd /var/www/ahava-healthcare
git clone https://github.com/MphoBeeThwala/ahava-healthcare.git .

# Install dependencies
cd apps/backend
npm ci --only=production

# Build application
npm run build
```

### Step 3: Configure Database

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE "ahava-healthcare";
CREATE USER ahava_prod WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE "ahava-healthcare" TO ahava_prod;
ALTER USER ahava_prod CREATEDB;
EOF

# Run migrations
npx prisma migrate deploy
```

### Step 4: Set Up Logs Directory

```bash
# Create logs directory
sudo mkdir -p /var/log/ahava-healthcare
sudo chown $USER:$USER /var/log/ahava-healthcare

# Set up log rotation
sudo nano /etc/logrotate.d/ahava-healthcare
```

Add to logrotate config:
```
/var/log/ahava-healthcare/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Step 5: Start Application

```bash
# Start with PM2
pm2 start npm --name "ahava-api" -- start

# Save PM2 configuration
pm2 save

# Set up auto-start on boot
pm2 startup
```

### Step 6: Configure Nginx

Follow the Nginx configuration above, then:

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 7: Set Up SSL

```bash
sudo certbot --nginx -d api.yourdomain.com
```

## Post-Deployment Verification

### Health Checks

```bash
# 1. API Health
curl https://api.yourdomain.com/health

# Expected: {"status":"ok",...}

# 2. Database Connection
curl https://api.yourdomain.com/api/auth/csrf-token

# Expected: {"success":true,"csrfToken":"..."}

# 3. Rate Limiting
for i in {1..6}; do
    curl -X POST https://api.yourdomain.com/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{"email":"test'$i'@test.com","password":"Test123!@#","firstName":"Test","lastName":"User","role":"PATIENT"}'
done

# Expected: 6th request should be rate limited

# 4. HTTPS/SSL
curl -I https://api.yourdomain.com | grep "Strict-Transport-Security"

# Expected: Header present

# 5. Logs
tail -f /var/log/ahava-healthcare/app-$(date +%Y-%m-%d).log

# Expected: JSON log entries

# 6. PM2 Status
pm2 status

# Expected: ahava-api online
```

### Security Verification

```bash
# Run security headers check
curl -I https://api.yourdomain.com

# Should include:
# - Strict-Transport-Security
# - X-Frame-Options
# - X-Content-Type-Options
# - X-XSS-Protection

# Test encryption
# Ensure sensitive data is encrypted in database

# Test RBAC
# Verify non-admin cannot access admin routes

# Test rate limiting
# Verify limits are enforced

# Test account lockout
# Verify lockout after 5 failed attempts
```

## Monitoring & Alerting

### Set Up Monitoring

```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Health Check Endpoints

Set up external monitoring (e.g., UptimeRobot, Pingdom):

- Health Check: `https://api.yourdomain.com/health` (every 5 minutes)
- Response Time: Monitor < 2 seconds
- Uptime Target: 99.9%

### Log Monitoring

Set up log aggregation (optional):

- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Datadog
- New Relic

### Alerts

Configure alerts for:

- API downtime (> 2 minutes)
- High error rate (> 5% of requests)
- Database connection failures
- Redis connection failures
- Disk space < 10% free
- Memory usage > 80%
- CPU usage > 80% for > 5 minutes

## Backup Strategy

### Database Backups

```bash
# Create backup script: /usr/local/bin/backup-db.sh
#!/bin/bash
DATE=$(date +%Y-%m-%d-%H%M%S)
BACKUP_DIR="/var/backups/ahava-healthcare"
mkdir -p $BACKUP_DIR

pg_dump -U ahava_prod ahava-healthcare | gzip > $BACKUP_DIR/db-backup-$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db-backup-*.sql.gz" -mtime +30 -delete
```

Make it executable:
```bash
sudo chmod +x /usr/local/bin/backup-db.sh
```

Schedule with cron:
```bash
sudo crontab -e

# Add:
0 2 * * * /usr/local/bin/backup-db.sh
```

### File Backups

```bash
# Backup logs and uploads
0 3 * * * tar -czf /var/backups/ahava-healthcare/logs-$(date +\%Y-\%m-\%d).tar.gz /var/log/ahava-healthcare/
```

## Rollback Plan

### Quick Rollback Steps

```bash
# 1. Stop current application
pm2 stop ahava-api

# 2. Checkout previous version
cd /var/www/ahava-healthcare
git checkout <previous-commit-hash>

# 3. Reinstall dependencies (if needed)
cd apps/backend
npm ci --only=production

# 4. Rollback database (if migrations were run)
npx prisma migrate resolve --rolled-back <migration-name>

# 5. Restart application
pm2 restart ahava-api

# 6. Verify
curl https://api.yourdomain.com/health
```

## Post-Deployment Tasks

- [ ] Update DNS records
- [ ] Configure monitoring
- [ ] Set up backups
- [ ] Document production URLs
- [ ] Train team on deployment process
- [ ] Set up staging environment
- [ ] Configure CI/CD pipeline (GitHub Actions)
- [ ] Schedule security audit
- [ ] Update documentation

## Production URLs

Document your production URLs:

- API Base URL: `https://api.yourdomain.com`
- Admin Portal: `https://admin.yourdomain.com` (when built)
- Doctor Portal: `https://doctor.yourdomain.com` (when built)
- Health Check: `https://api.yourdomain.com/health`

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor logs for errors
- Check system resources
- Verify backups completed

**Weekly:**
- Review security logs
- Check for package updates
- Review performance metrics

**Monthly:**
- Update dependencies
- Review and rotate secrets
- Conduct security review
- Test backup restoration

### Emergency Contacts

Document your emergency contacts:
- DevOps Lead: _______________
- Security Team: _______________
- Database Admin: _______________
- On-Call Engineer: _______________

## Sign-Off

### Deployment Approval

- [ ] All pre-deployment checks completed
- [ ] Security review approved
- [ ] Testing completed and passed
- [ ] Environment variables configured
- [ ] SSL/HTTPS configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Rollback plan tested

**Deployed By**: _________________  
**Date**: _________________  
**Version**: _________________  
**Approved By**: _________________  

---

**Status**: ☐ READY FOR DEPLOYMENT ☐ IN PROGRESS ☐ DEPLOYED ☐ VERIFIED

**Last Updated**: October 9, 2025


