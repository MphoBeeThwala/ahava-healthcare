# 🗄️ Test Database Setup Guide

## Overview

This guide will help you set up a separate test database so all 179 tests can run, including the 26 integration tests.

---

## ✅ Prerequisites

- ✅ Docker running (PostgreSQL container)
- ✅ Backend running successfully
- ✅ Main database (`ahava-healthcare`) working

---

## 🚀 Quick Setup (5 minutes)

### **Option A: Using Docker (Recommended)**

The test database will be created in the same PostgreSQL container as your development database.

#### Step 1: Create Test Database

```powershell
# Connect to PostgreSQL container and create test database
docker exec -it ahava-postgres psql -U ahava_user -d ahava-healthcare -c "CREATE DATABASE \"ahava-healthcare-test\";"
```

**Expected Output:**
```
CREATE DATABASE
```

#### Step 2: Verify Test Database Exists

```powershell
docker exec -it ahava-postgres psql -U ahava_user -d postgres -c "\l"
```

**You should see both:**
- `ahava-healthcare` (main database)
- `ahava-healthcare-test` (test database)

#### Step 3: Run Migrations on Test Database

```powershell
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\backend

# Temporarily set DATABASE_URL to test database
$env:DATABASE_URL="postgresql://ahava_user:ahava_dev_password@localhost:5432/ahava-healthcare-test?schema=public"

# Run migrations
npx prisma migrate deploy

# Reset DATABASE_URL (or just close and reopen terminal)
Remove-Item Env:\DATABASE_URL
```

**Expected Output:**
```
Applying migration `20250929172822_init`
All migrations have been successfully applied.
```

#### Step 4: Run All Tests

```powershell
yarn test
```

**Expected Output:**
```
Test Suites: 11 passed, 11 total
Tests:       179 passed, 179 total
Time:        ~10 seconds
```

---

### **Option B: Manual PostgreSQL Commands**

If Docker commands don't work, use psql directly:

```powershell
# Method 1: Using psql in container
docker exec -it ahava-postgres bash
psql -U ahava_user -d postgres
CREATE DATABASE "ahava-healthcare-test";
\q
exit

# Method 2: Using docker exec with psql
docker exec -it ahava-postgres createdb -U ahava_user ahava-healthcare-test
```

---

## 🔍 Verification Steps

### Check Test Database Exists
```powershell
docker exec -it ahava-postgres psql -U ahava_user -d ahava-healthcare-test -c "SELECT 1;"
```

**Should return:**
```
 ?column? 
----------
        1
```

### Check Tables Exist After Migration
```powershell
docker exec -it ahava-postgres psql -U ahava_user -d ahava-healthcare-test -c "\dt"
```

**Should list:**
- users
- bookings
- visits
- messages
- payments
- refresh_tokens
- audit_logs
- export_jobs

---

## 🧪 Running Tests

### Run Only Integration Tests
```powershell
yarn test auth.test.ts
```

### Run All Tests
```powershell
yarn test
```

### Run with Coverage
```powershell
yarn test --coverage
```

---

## 🔧 Troubleshooting

### Issue: "Database does not exist"

**Solution 1:** Check Docker container is running
```powershell
docker ps | Select-String postgres
```

**Solution 2:** Recreate database
```powershell
docker exec -it ahava-postgres dropdb -U ahava_user ahava-healthcare-test --if-exists
docker exec -it ahava-postgres createdb -U ahava_user ahava-healthcare-test
```

### Issue: "Permission denied"

**Solution:** Verify user has permissions
```powershell
docker exec -it ahava-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"ahava-healthcare-test\" TO ahava_user;"
```

### Issue: "Migration failed"

**Solution:** Reset and retry
```powershell
$env:DATABASE_URL="postgresql://ahava_user:ahava_dev_password@localhost:5432/ahava-healthcare-test"
npx prisma migrate reset --force
npx prisma migrate deploy
Remove-Item Env:\DATABASE_URL
```

### Issue: "Connection refused"

**Solution:** Check PostgreSQL is accepting connections
```powershell
docker logs ahava-postgres --tail 50
```

---

## 🎯 Expected Test Results After Setup

### Before Test DB Setup
```
Test Suites: 10 passed, 1 failed, 11 total
Tests:       153 passed, 26 failed, 179 total
```

### After Test DB Setup
```
Test Suites: 11 passed, 11 total
Tests:       179 passed, 179 total ✅
Coverage:    ~30% (up from 23.35%)
```

---

## 🔄 Resetting Test Data

### Clean Test Database (Between Test Runs)
```powershell
$env:DATABASE_URL="postgresql://ahava_user:ahava_dev_password@localhost:5432/ahava-healthcare-test"
npx prisma migrate reset --force
Remove-Item Env:\DATABASE_URL
```

### Quick Reset Without Migrations
```powershell
docker exec -it ahava-postgres psql -U ahava_user -d ahava-healthcare-test -c "
  TRUNCATE users, bookings, visits, messages, payments, refresh_tokens, audit_logs, export_jobs CASCADE;
"
```

---

## 📝 Test Database vs Production Database

| Feature | Development DB | Test DB | Production DB |
|---------|----------------|---------|---------------|
| **Name** | ahava-healthcare | ahava-healthcare-test | ahava-healthcare-prod |
| **Data** | Sample users | Temporary test data | Real user data |
| **Reset** | Rarely | After each test run | Never |
| **Seeded** | Yes (4 users) | No (clean) | No |
| **Migrations** | Dev mode | Deploy only | Deploy only |

---

## 🎓 Why Separate Test Database?

1. ✅ **Isolation** - Tests don't affect development data
2. ✅ **Clean State** - Each test starts fresh
3. ✅ **Speed** - Can reset/recreate quickly
4. ✅ **Safety** - Can't accidentally delete real data
5. ✅ **Parallel** - Can run tests while developing

---

## ✅ Checklist

- [ ] Docker container running
- [ ] Test database created
- [ ] Migrations applied to test database
- [ ] All 179 tests passing
- [ ] Coverage report shows ~30%
- [ ] Integration tests working

---

**Ready to create your test database!**

**Next: Follow Step 1 above to create the test database.**

