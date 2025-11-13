Production deployment briefing

Pre-deployment status: security remediation from weeks one and two is complete (AES-256-GCM encryption, admin RBAC, hardened password policy, account lockout, improved rate limiting, input validation, CSRF protection, structured logging, sanitized error handling). Resolve any remaining TypeScript or linting errors and confirm security documentation before go-live. Ensure dependencies are installed, `express-rate-limit` is present, `npm audit` reports no critical issues, and production builds exclude dev-only packages. All unit, integration, and security tests must pass; complete manual, load, and (ideally) penetration testing. Confirm PostgreSQL is provisioned with migrations applied, permissions locked down, backup and pooling strategies defined, and optional encryption addressed. Redis should be configured with persistence, BullMQ queues initialized, and a backup policy in place.

Create a production `.env` with strong secrets:
```
DATABASE_URL="postgresql://user:STRONG_PASSWORD@host:5432/ahava-healthcare"
JWT_SECRET="GENERATE_STRONG_32_CHAR_SECRET_HERE"
REFRESH_TOKEN_EXPIRES_IN="7d"
ENCRYPTION_KEY="BASE64_ENCODED_32_BYTE_KEY_HERE"
ENCRYPTION_IV_SALT="HEX_ENCODED_16_BYTE_SALT_HERE"
REDIS_URL="redis://:password@host:6379"
PAYSTACK_SECRET_KEY="sk_live_..."
PAYSTACK_PUBLIC_KEY="pk_live_..."
PAYSTACK_WEBHOOK_SECRET="..."
PORT=4000
NODE_ENV="production"
TIMEZONE="Africa/Johannesburg"
LOG_DIR="/var/log/ahava-healthcare"
CORS_ORIGIN="https://admin.yourdomain.com,https://doctor.yourdomain.com"
SMTP_HOST="smtp.yourdomain.com"
SMTP_PORT=587
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="SMTP_PASSWORD"
SMTP_FROM="noreply@ahavahealthcare.co.za"
```
Generate secrets with `openssl rand` on Linux/macOS or PowerShell RNG snippets on Windows.

Infrastructure requirements: minimum 2 vCPU/4 GB RAM/50 GB SSD, recommended 4 vCPU/8 GB RAM/100 GB SSD with 1 Gbps networking. Enforce HTTPS; either request certificates with Certbot (`sudo certbot --nginx -d api.yourdomain.com`) or rely on managed platform SSL (Railway/Render). Set up Nginx as a reverse proxy, redirecting HTTP to HTTPS, applying HSTS and security headers, and proxying to the Node.js service on port 4000—including WebSocket support. Manage the process with PM2 (`pm2 start npm --name "ahava-api" -- start`, followed by `pm2 save` and `pm2 startup`). Secure the firewall (allow 22, 80, 443; deny direct access to ports 4000, 5432, 6379).

Deployment steps: update the OS, install Node.js 20, PostgreSQL, Redis, Nginx, and build tools. Clone the repository into `/var/www/ahava-healthcare`, install backend dependencies with `npm ci --only=production`, and run `npm run build`. Create the production database/user via `psql`, apply migrations with `npx prisma migrate deploy`, and seed if required. Prepare `/var/log/ahava-healthcare`, configure logrotate to rotate daily and trigger `pm2 reloadLogs`, then start the app with PM2. Configure Nginx, restart the service, and enable it on boot; obtain SSL certificates if not automatically provisioned.

Post-deployment verification includes:
```
curl https://api.yourdomain.com/health            # expect {"status":"ok"}
curl https://api.yourdomain.com/api/auth/csrf-token  # expect success payload
for i in {1..6}; do curl -X POST https://api.yourdomain.com/api/auth/register ...; done  # sixth call should rate-limit
curl -I https://api.yourdomain.com | grep "Strict-Transport-Security"
tail -f /var/log/ahava-healthcare/app-$(date +%Y-%m-%d).log
pm2 status
```
Review security headers, encryption, RBAC, rate limiting, and lockout behavior. Install `pm2-logrotate`, configure retention (`pm2 set pm2-logrotate:max_size 10M`, `retain 30`), and register uptime monitors (e.g., UptimeRobot hitting `https://api.yourdomain.com/health` every five minutes with a 99.9% target). Consider aggregating logs with ELK, Splunk, Datadog, or New Relic, and configure alerts for downtime, high error rates, database/Redis failures, disk/memory/CPU thresholds.

Backups: add `/usr/local/bin/backup-db.sh` to dump and gzip the database nightly, pruning older than thirty days via cron (`0 2 * * *`). Archive logs/uploads separately (`0 3 * * * tar -czf ...`). Rollback plan: `pm2 stop ahava-api`, checkout the previous commit, reinstall production dependencies if needed, resolve the latest migration as rolled back, restart, and verify the health endpoint. Document post-deployment tasks (DNS updates, monitoring, backups, production URLs, team training, staging parity, CI/CD configuration, security audit scheduling, documentation refresh). Record production URLs for the API and each portal.

Maintenance rhythm: daily log and resource checks plus backup verification; weekly security log review, dependency updates, and performance analysis; monthly dependency upgrades, secret rotation, security reviews, and backup restoration drills. Keep emergency contacts for DevOps, security, database, and on-call roles current. Before signing off, confirm every pre-deployment checkbox, security review, testing milestone, environment variable, SSL configuration, monitoring hook, backup job, and rollback test; capture who deployed, when, which version, and approval. Update the status (ready, in progress, deployed, verified) as the rollout proceeds.

Checklist compiled by Mpho Thwala on behalf of Ahava on 88 Company.
