# 🔧 Environment Variables Setup Guide

**Quick Setup:** 2 minutes per app

---

## 📋 SETUP INSTRUCTIONS

### **For Each App (Admin, Patient, Nurse, Doctor):**

1. Navigate to the app directory
2. Create `.env.local` file
3. Copy the configuration below
4. Save the file

---

## 📝 CONFIGURATION FILES

### 1. **Admin Portal** (`apps/admin/.env.local`)

```env
# Ahava Healthcare Admin Portal - Environment Configuration

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# WebSocket URL
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# App Configuration
NEXT_PUBLIC_APP_NAME=Ahava Healthcare Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**PowerShell Command:**
```powershell
cd apps/admin
@"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_APP_NAME=Ahava Healthcare Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
"@ | Out-File -FilePath .env.local -Encoding utf8
cd ../..
```

---

### 2. **Patient App** (`apps/patient/.env.local`)

```env
# Ahava Healthcare Patient App - Environment Configuration

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# WebSocket URL
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# Paystack Configuration (Test Mode)
# Get your key from: https://dashboard.paystack.com/#/settings/developer
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# App Configuration
NEXT_PUBLIC_APP_NAME=Ahava Healthcare
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**PowerShell Command:**
```powershell
cd apps/patient
@"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_NAME=Ahava Healthcare
NEXT_PUBLIC_APP_VERSION=1.0.0
"@ | Out-File -FilePath .env.local -Encoding utf8
cd ../..
```

---

### 3. **Nurse App** (`apps/nurse/.env.local`)

```env
# Ahava Healthcare Nurse App - Environment Configuration

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# WebSocket URL
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# App Configuration
NEXT_PUBLIC_APP_NAME=Ahava Healthcare Nurse
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**PowerShell Command:**
```powershell
cd apps/nurse
@"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_APP_NAME=Ahava Healthcare Nurse
NEXT_PUBLIC_APP_VERSION=1.0.0
"@ | Out-File -FilePath .env.local -Encoding utf8
cd ../..
```

---

### 4. **Doctor Portal** (`apps/doctor/.env.local`)

```env
# Ahava Healthcare Doctor Portal - Environment Configuration

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# WebSocket URL
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# App Configuration
NEXT_PUBLIC_APP_NAME=Ahava Healthcare Doctor
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**PowerShell Command:**
```powershell
cd apps/doctor
@"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_APP_NAME=Ahava Healthcare Doctor
NEXT_PUBLIC_APP_VERSION=1.0.0
"@ | Out-File -FilePath .env.local -Encoding utf8
cd ../..
```

---

## 🚀 QUICK SETUP - ALL APPS AT ONCE

Run this PowerShell script to set up all environment files:

```powershell
# Admin
cd apps/admin
@"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_APP_NAME=Ahava Healthcare Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
"@ | Out-File -FilePath .env.local -Encoding utf8

# Patient
cd ../patient
@"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_NAME=Ahava Healthcare
NEXT_PUBLIC_APP_VERSION=1.0.0
"@ | Out-File -FilePath .env.local -Encoding utf8

# Nurse
cd ../nurse
@"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_APP_NAME=Ahava Healthcare Nurse
NEXT_PUBLIC_APP_VERSION=1.0.0
"@ | Out-File -FilePath .env.local -Encoding utf8

# Doctor
cd ../doctor
@"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_APP_NAME=Ahava Healthcare Doctor
NEXT_PUBLIC_APP_VERSION=1.0.0
"@ | Out-File -FilePath .env.local -Encoding utf8

cd ../..

Write-Host "✅ All environment files created!" -ForegroundColor Green
```

---

## ✅ VERIFY SETUP

After creating the files, verify they exist:

```powershell
Test-Path apps/admin/.env.local
Test-Path apps/patient/.env.local
Test-Path apps/nurse/.env.local
Test-Path apps/doctor/.env.local
```

All commands should return `True`

---

## 📝 NOTES

### About `NEXT_PUBLIC_` Prefix:
- Required for Next.js to expose variables to the browser
- Variables WITHOUT this prefix are server-side only

### Backend URL:
- Default: `http://localhost:4000`
- Change if your backend runs on a different port
- In production, use your deployed backend URL

### WebSocket URL:
- Default: `ws://localhost:4000`
- Must match your backend WebSocket server
- In production, use `wss://` (secure WebSocket)

### Paystack Public Key:
- Get from: https://dashboard.paystack.com/#/settings/developer
- Use TEST key for development
- Switch to LIVE key for production

---

## 🔐 SECURITY

### ⚠️ IMPORTANT:
- `.env.local` files are in `.gitignore`
- NEVER commit `.env.local` to git
- NEVER share your Paystack keys publicly
- Use different keys for test/production

---

## ❓ TROUBLESHOOTING

### Variables not loading?
1. Restart Next.js dev server (`npm run dev`)
2. Check file is named exactly `.env.local` (not `.env.local.txt`)
3. Verify variables start with `NEXT_PUBLIC_`

### Still not working?
```powershell
# Check if file exists
Get-Content apps/admin/.env.local

# Should show your environment variables
```

---

**Created:** October 15, 2024  
**Status:** Ready to use  
**Next Step:** Run the PowerShell script above!

