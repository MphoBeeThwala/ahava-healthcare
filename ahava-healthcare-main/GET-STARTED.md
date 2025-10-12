# 🚀 GET STARTED - FASTEST PATH TO RUNNING PLATFORM

## ⚡ QUICK START (Choose Your Path)

### 🌐 **PATH 1: Cloud Databases** (Recommended - Fastest - FREE)
**Time**: 15-20 minutes | **Cost**: $0

✅ No Docker needed  
✅ No local PostgreSQL/Redis installation  
✅ Works on any computer  
✅ Production-like environment  

**Steps**:
1. **Set up FREE cloud databases**:
   - PostgreSQL: [Supabase](https://supabase.com) - 500MB free
   - Redis: [Upstash](https://upstash.com) - 10K commands/day free

2. **Get connection strings** from dashboards

3. **Update backend .env**:
   ```powershell
   # Edit apps\backend\.env
   # Replace DATABASE_URL and REDIS_URL with your cloud URLs
   ```

4. **Run migrations**:
   ```powershell
   cd apps\backend
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed
   ```

5. **Start all services**:
   ```powershell
   .\START-DEVELOPMENT.ps1
   ```

📖 **Detailed Guide**: See `SETUP-CLOUD-DB.md`

---

### 🐳 **PATH 2: Docker** (If you have Docker Desktop)
**Time**: 10 minutes | **Cost**: $0

✅ Everything in containers  
✅ Easy to start/stop  
✅ Matches production  

**Steps**:
1. **Install Docker Desktop**: https://www.docker.com/products/docker-desktop/
   - Download, install, restart computer

2. **Start databases**:
   ```powershell
   docker-compose up -d
   ```

3. **Verify running**:
   ```powershell
   docker-compose ps
   ```

4. **Run migrations**:
   ```powershell
   cd apps\backend
   npx prisma generate
   npx prisma migrate dev
   npm run prisma:seed
   ```

5. **Start all services**:
   ```powershell
   .\START-DEVELOPMENT.ps1
   ```

---

### 💻 **PATH 3: Local Installation** (Traditional)
**Time**: 30-45 minutes | **Cost**: $0

⚠️ More complex  
⚠️ Requires multiple installations  

Not recommended unless you have specific requirements.

---

## 🎯 RECOMMENDED: PATH 1 (Cloud Databases)

This is the **fastest and easiest** way to get started. Here's the complete walkthrough:

### Step 1: Create Supabase Account (PostgreSQL)

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub/Google
4. Click "New project"
5. Fill in:
   - **Name**: ahava-healthcare
   - **Database Password**: Create strong password (SAVE IT!)
   - **Region**: Choose closest to you
   - **Pricing**: Free
6. Wait 2-3 minutes for project to be created
7. Go to **Settings** → **Database**
8. Under "Connection string" → "URI", copy the connection string
9. Replace `[YOUR-PASSWORD]` with your actual password

**Example**:
```
postgresql://postgres.abcdef:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### Step 2: Create Upstash Account (Redis)

1. Go to https://console.upstash.com/
2. Sign in with GitHub/Google
3. Click "Create Database"
4. Fill in:
   - **Name**: ahava-redis
   - **Type**: Regional
   - **Region**: Choose closest to you
   - **Pricing**: Free (Pay as you go)
5. Click "Create"
6. On database page, copy the **Redis URL** (starts with `redis://`)

**Example**:
```
redis://default:ABCD1234xyz@us1-great-shark-12345.upstash.io:6379
```

### Step 3: Update Backend Environment

Open `apps\backend\.env` in a text editor and update:

```env
# Replace these lines with YOUR cloud database URLs:
DATABASE_URL="postgresql://postgres.abcdef:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
REDIS_URL="redis://default:YOUR_TOKEN@us1-great-shark-12345.upstash.io:6379"

# These are already set (secure keys generated):
JWT_SECRET="OIRaC71HU5nYW3sF0QL8burViyJojqcN"
ENCRYPTION_KEY="27q+InwHvCtaz02y4Az09Nqko3knxxlPpW4paIG/MTU="
ENCRYPTION_IV_SALT="d940800855512c8fccd9d9d764a277df"

# Server settings (already correct):
PORT=4000
NODE_ENV="development"
TIMEZONE="Africa/Johannesburg"
```

### Step 4: Run Database Migrations

Open PowerShell in the project folder:

```powershell
cd apps\backend
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

You should see:
```
✓ Admin created: admin@ahava.com
✓ Doctor created: doctor@ahava.com
✓ Nurse created: nurse@ahava.com
✓ Patient created: patient@ahava.com
```

### Step 5: Start All Services

Back in the root folder:

```powershell
cd ..\..
.\START-DEVELOPMENT.ps1
```

This will open 6 PowerShell windows, each running a service.

### Step 6: Access Your Applications

Open your browser and visit:

- **Backend API**: http://localhost:4000/health
- **Admin Portal**: http://localhost:3000
- **Doctor Portal**: http://localhost:3001
- **Patient App**: http://localhost:3002
- **Nurse App**: http://localhost:3003

### Step 7: Login with Test Accounts

Use these credentials to test:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@ahava.com | Test@123456789 |
| **Doctor** | doctor@ahava.com | Test@123456789 |
| **Nurse** | nurse@ahava.com | Test@123456789 |
| **Patient** | patient@ahava.com | Test@123456789 |

---

## 🎉 YOU'RE RUNNING!

Your complete healthcare platform is now running locally with cloud databases!

### What You Can Do Now:

1. **Admin Portal** (localhost:3000):
   - Login as admin@ahava.com
   - View all users
   - Manage visits
   - View payments

2. **Patient App** (localhost:3002):
   - Login as patient@ahava.com
   - Book a visit
   - View visit history
   - Make payments

3. **Nurse App** (localhost:3003):
   - Login as nurse@ahava.com
   - View assigned visits
   - Update visit status
   - Submit reports

4. **Doctor Portal** (localhost:3001):
   - Login as doctor@ahava.com
   - Review visits
   - Check nurse reports
   - Submit reviews

---

## 🐛 Troubleshooting

### Backend won't start
```powershell
# Check if database connection works
cd apps\backend
npx prisma db pull
```

### Migrations fail
```powershell
# Reset and try again
npx prisma migrate reset
npx prisma migrate deploy
```

### Can't connect to database
- Verify DATABASE_URL in .env
- Check Supabase project is active
- Ensure password is correct (no special characters causing issues)

### Can't connect to Redis
- Verify REDIS_URL in .env
- Check Upstash database is active
- Ensure you copied the full URL with password

### Port already in use
```powershell
# Find and kill process on port 4000
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process
```

---

## 📞 Next Steps

Once everything is running:

1. ✅ Test all user journeys (see TESTING-CHECKLIST.md)
2. ✅ Set up Paystack account for payments
3. ✅ Configure email service (SendGrid/Gmail)
4. ✅ Set up Expo for push notifications
5. ✅ Deploy to production (see DEPLOYMENT-CHECKLIST.md)

---

## 💡 Tips

- **Free tier limits** are generous for development/testing
- **Upgrade to production** when you have real users
- **Cloud databases** can be used in production too
- **Backups** are automatic with Supabase
- **Monitoring** is built-in to both platforms

---

## 🚀 Ready for Production?

When ready to deploy:
1. Follow `DEPLOYMENT-CHECKLIST.md`
2. Keep using cloud databases (or upgrade to dedicated)
3. Deploy frontend to Vercel
4. Deploy backend to Railway/Render
5. Set up custom domain
6. Configure production environment variables

---

**You're all set! Happy coding! 🎉**

For questions, check:
- INSTALLATION-GUIDE.md
- DEPLOYMENT-CHECKLIST.md
- TESTING-CHECKLIST.md
- PROJECT-STATUS.md

