# 🚀 Running All Services - Quick Guide

## Terminal Commands

Open 6 PowerShell terminals and run these commands:

### Terminal 1: Backend API
```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\backend
npm run dev
```
**Expected**: Server running on http://localhost:4000

### Terminal 2: Background Workers
```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\backend
npm run dev:worker
```
**Expected**: Workers started (Email, PDF, Push)

### Terminal 3: Admin Portal
```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\admin
npm run dev
```
**Expected**: Server running on http://localhost:3000

### Terminal 4: Doctor Portal
```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\doctor
npm run dev
```
**Expected**: Server running on http://localhost:3001

### Terminal 5: Patient App
```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\patient
npm run dev
```
**Expected**: Server running on http://localhost:3002

### Terminal 6: Nurse App
```powershell
cd C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main\apps\nurse
npm run dev
```
**Expected**: Server running on http://localhost:3003

## URLs to Access
- Backend API: http://localhost:4000/health
- Admin Portal: http://localhost:3000
- Doctor Portal: http://localhost:3001
- Patient App: http://localhost:3002
- Nurse App: http://localhost:3003

