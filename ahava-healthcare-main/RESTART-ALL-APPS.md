# 🚀 Restart All Applications

## ⚡ Quick Restart Guide

Follow these steps to restart all applications cleanly:

---

## 📍 **STEP 1: Stop All Running Apps**

If you have apps running in PowerShell windows:
1. Go to each PowerShell window
2. Press `Ctrl + C` to stop the running app
3. Close all PowerShell windows

---

## 📍 **STEP 2: Start Backend (Terminal 1)**

Open **PowerShell Window #1** and run:

```powershell
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\backend
npm run dev
```

**Expected Output:**
```
✅ Server running on http://localhost:4000
✅ Database connected
✅ Redis connected
```

**Backend URL:** http://localhost:4000/health

---

## 📍 **STEP 3: Start Admin Portal (Terminal 2)**

Open **PowerShell Window #2** and run:

```powershell
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\admin
npm run dev
```

**Expected Output:**
```
✓ Ready in 2-3s
○ Local: http://localhost:3000
```

**Admin Portal URL:** http://localhost:3000/login

---

## 📍 **STEP 4: Start Patient App (Terminal 3)**

Open **PowerShell Window #3** and run:

```powershell
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\patient
npm run dev
```

**Expected Output:**
```
✓ Ready in 2-3s
○ Local: http://localhost:3002
```

**Patient App URL:** http://localhost:3002/login

---

## 📍 **STEP 5: Start Nurse App (Terminal 4)**

Open **PowerShell Window #4** and run:

```powershell
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\nurse
npm run dev
```

**Expected Output:**
```
✓ Ready in 2-3s
○ Local: http://localhost:3003
```

**Nurse App URL:** http://localhost:3003/login

---

## 📍 **STEP 6: (Optional) Start Doctor Portal (Terminal 5)**

Open **PowerShell Window #5** and run:

```powershell
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\doctor
npm run dev
```

**Expected Output:**
```
✓ Ready in 2-3s
○ Local: http://localhost:3001
```

**Doctor Portal URL:** http://localhost:3001/login

---

## 🧪 **Test Credentials**

### **Admin Portal (localhost:3000)**
```
Email: admin@example.com
Password: password123
```

### **Patient App (localhost:3002)**
```
Email: patient@example.com
Password: password123
```

### **Nurse App (localhost:3003)**
```
Email: nurse@example.com
Password: password123
```

### **Doctor Portal (localhost:3001)**
```
Email: doctor@example.com
Password: password123
```

---

## ✅ **Verification Checklist**

After starting each app, verify:

- [ ] Backend shows "Server running on http://localhost:4000"
- [ ] Admin Portal opens at http://localhost:3000/login
- [ ] Patient App opens at http://localhost:3002/login
- [ ] Nurse App opens at http://localhost:3003/login
- [ ] All login pages load without errors
- [ ] Can login successfully with test credentials

---

## 🐛 **Troubleshooting**

### **Port Already in Use:**
```powershell
# Find process using port (e.g., 4000)
netstat -ano | findstr :4000

# Kill process by PID
taskkill /PID <PID> /F
```

### **Module Not Found Errors:**
```powershell
# In the app directory
npm install
```

### **Backend Not Connecting:**
Check your `.env` file in `apps/backend/`:
```
DATABASE_URL="your-database-url"
REDIS_URL="your-redis-url"
JWT_SECRET="your-secret"
```

---

## 📊 **Expected Running Services**

After completing all steps:

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Backend | 4000 | http://localhost:4000 | ✅ |
| Admin | 3000 | http://localhost:3000 | ✅ |
| Doctor | 3001 | http://localhost:3001 | ⏳ |
| Patient | 3002 | http://localhost:3002 | ✅ |
| Nurse | 3003 | http://localhost:3003 | ✅ |

---

## 🎯 **Next Steps After Restart**

1. **Login Test** - Try logging into each app with the credentials above
2. **Dashboard Test** - Verify data is displaying correctly
3. **Flow Test** - Test complete patient → nurse → doctor workflow
4. **Integration Test** - Test booking creation and visit updates

---

**🎉 Good luck! Your Ahava Healthcare platform should be ready to test!**

