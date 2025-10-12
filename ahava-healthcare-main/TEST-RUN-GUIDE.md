# 🧪 Test Run Guide - All Services

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js installed (v20+)
- ✅ npm available in PATH
- ⏳ PostgreSQL installed and running
- ⏳ Redis installed and running

---

## Step-by-Step Test Run

### Phase 1: Setup (One-time)

#### 1. Run Setup Scripts

```powershell
# Navigate to project root
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main

# Run quick start script (installs all dependencies)
.\QUICK-START.ps1

# Run environment setup script
.\SETUP-ENV.ps1
```

#### 2. Configure Backend Environment

```powershell
cd apps\backend

# Copy example env
Copy-Item env.example .env

# Edit .env file with secure keys
notepad .env
```

**Important**: Update these in .env:
- `DATABASE_URL` - Your PostgreSQL connection string
- `REDIS_URL` - Your Redis connection string
- `JWT_SECRET` - Generate a strong secret
- `ENCRYPTION_KEY` - Generate a base64 key

#### 3. Run Database Migrations

```powershell
cd apps\backend
npx prisma generate
npx prisma migrate dev
```

---

### Phase 2: Start Services

Open **6 separate PowerShell terminals** and run these commands:

#### Terminal 1: Backend API ⚡

```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\backend
npm run dev
```

**Wait for**:
```
✅ Redis connected
✅ BullMQ queues initialized
🚀 Ahava Healthcare API server running on port 4000
```

**Test**:
```powershell
# In another terminal
curl http://localhost:4000/health
```

**Expected**: `{"status":"ok","timestamp":"...","timezone":"Africa/Johannesburg"}`

---

#### Terminal 2: Background Workers 🔄

```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\backend
npm run dev:worker
```

**Wait for**:
```
✅ Redis connected for workers
✅ Email worker started
✅ PDF worker started
✅ Push notification worker started
Worker process ready to handle jobs
```

---

#### Terminal 3: Admin Portal 🔧

```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\admin
npm run dev
```

**Wait for**:
```
✓ Ready in Xs
○ Local:   http://localhost:3000
```

**Test**: Open http://localhost:3000 in browser

---

#### Terminal 4: Doctor Portal 👨‍⚕️

```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\doctor
npm run dev
```

**Wait for**:
```
✓ Ready in Xs
○ Local:   http://localhost:3001
```

**Test**: Open http://localhost:3001 in browser

---

#### Terminal 5: Patient App 👤

```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\patient
npm run dev
```

**Wait for**:
```
✓ Ready in Xs
○ Local:   http://localhost:3002
```

**Test**: Open http://localhost:3002 in browser

---

#### Terminal 6: Nurse App 👩‍⚕️

```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\nurse
npm run dev
```

**Wait for**:
```
✓ Ready in Xs
○ Local:   http://localhost:3003
```

**Test**: Open http://localhost:3003 in browser

---

### Phase 3: Verification

#### 1. Check All Services Running

Open browser tabs:
- ✅ http://localhost:4000/health - Should show `{"status":"ok"}`
- ✅ http://localhost:3000 - Should show Admin login
- ✅ http://localhost:3001 - Should show Doctor login
- ✅ http://localhost:3002 - Should show Patient login/register
- ✅ http://localhost:3003 - Should show Nurse login

#### 2. Create Test Admin User

```powershell
# Using curl or Postman
curl -X POST http://localhost:4000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@ahava.com",
    "password": "Admin@123456789",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

#### 3. Test Admin Login

1. Go to http://localhost:3000
2. Login with:
   - Email: `admin@ahava.com`
   - Password: `Admin@123456789`
3. Should redirect to dashboard with statistics

#### 4. Create Test Users for Other Roles

**Doctor**:
```powershell
curl -X POST http://localhost:4000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "doctor@ahava.com",
    "password": "Doctor@123456789",
    "firstName": "Dr. John",
    "lastName": "Smith",
    "role": "DOCTOR"
  }'
```

**Nurse**:
```powershell
curl -X POST http://localhost:4000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "nurse@ahava.com",
    "password": "Nurse@123456789",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "role": "NURSE"
  }'
```

**Patient**: Use registration form at http://localhost:3002/login

---

### Phase 4: Test Complete Workflow

#### Complete Patient Journey

1. **Register as Patient** (http://localhost:3002/login)
   - Click "Sign up"
   - Fill form
   - Create account

2. **Book a Visit** (http://localhost:3002/book)
   - Select date/time (future date)
   - Enter address
   - Choose payment method
   - Click "Book & Pay"

3. **View Your Visits** (http://localhost:3002/visits)
   - See your booking
   - Note the status

#### Admin Operations

1. **Login as Admin** (http://localhost:3000)

2. **View the Booking**
   - Go to Visits
   - See the new booking

3. **Assign Nurse**
   - Click on visit (when detail page added)
   - Or use API:
   ```powershell
   curl -X POST http://localhost:4000/api/visits/{VISIT_ID}/assign-nurse `
     -H "Authorization: Bearer {ADMIN_TOKEN}" `
     -H "Content-Type: application/json" `
     -d '{"nurseId": "{NURSE_ID}"}'
   ```

#### Nurse Workflow

1. **Login as Nurse** (http://localhost:3003)

2. **See Today's Visits**
   - View assigned visit

3. **Update Status**
   - Click "Start Journey" (EN_ROUTE)
   - Click "Mark Arrived" (ARRIVED)
   - Click "Start Visit" (IN_PROGRESS)
   - Click "Complete & Report"

4. **Submit Report**
   - Write detailed report
   - Submit

#### Doctor Review

1. **Login as Doctor** (http://localhost:3001)

2. **View Visit**
   - Click on completed visit

3. **Review Nurse Report**
   - Read the nurse's report

4. **Submit Review**
   - Rate 1-5 stars
   - Write review
   - Submit

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error**: "Cannot find module"
```powershell
cd apps\backend
Remove-Item -Recurse -Force node_modules
npm install
```

**Error**: "Database connection failed"
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Test connection: `psql -U ahava_user -d ahava-healthcare`

**Error**: "Redis connection failed"
- Check Redis is running
- Verify REDIS_URL in .env
- If using WSL: `wsl sudo service redis-server start`

### Frontend Won't Start

**Error**: "Cannot find module"
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

**Error**: "API_URL not defined"
- Check .env.local exists
- Verify NEXT_PUBLIC_API_URL is set

**Error**: "Port already in use"
```powershell
# Kill process on port (e.g., 3000)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Can't Login

**Error**: "Invalid credentials"
- Verify user exists: Check database or create via API
- Ensure password meets requirements (12+ chars)
- Check backend is running

**Error**: "CORS error"
- Verify withCredentials: true in axios
- Check backend CORS configuration

---

## ✅ Success Indicators

### Backend
- ✅ Health endpoint responds: http://localhost:4000/health
- ✅ No errors in console
- ✅ "Server running on port 4000" message

### Workers
- ✅ "All workers started successfully"
- ✅ No error messages

### Frontend Apps
- ✅ "Ready in Xs" message
- ✅ Login page loads in browser
- ✅ No compilation errors

---

## 📊 Expected Performance

### Startup Times
- Backend: 2-5 seconds
- Workers: 2-3 seconds
- Each Frontend: 3-10 seconds (first time may be slower)

### Response Times
- API calls: < 200ms
- Page loads: < 1 second
- Real-time updates: < 100ms

---

## 🎯 Test Checklist

### Backend
- [ ] Health check responds
- [ ] Can create users
- [ ] Can login
- [ ] Can create booking
- [ ] Can process payment
- [ ] Workers running

### Admin Portal
- [ ] Login page loads
- [ ] Can login as admin
- [ ] Dashboard shows stats
- [ ] Can view users
- [ ] Can view visits
- [ ] Can view payments

### Doctor Portal
- [ ] Login page loads
- [ ] Can login as doctor
- [ ] Can view assigned visits
- [ ] Can submit review

### Patient App
- [ ] Login/Register page loads
- [ ] Can register new patient
- [ ] Can book a visit
- [ ] Can view visit history

### Nurse App
- [ ] Login page loads
- [ ] Can login as nurse
- [ ] Can see today's visits
- [ ] Can update visit status
- [ ] Can submit report

---

## 🎉 Success!

If all services start without errors and all URLs are accessible:

**🎊 CONGRATULATIONS! Your platform is running!** 🎊

---

**Next**: Test complete user workflows and explore all features!

