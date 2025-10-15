# 🎨 Frontend Implementation Plan - Option B

**Start Date:** October 15, 2024  
**Approach:** Frontend-First  
**Goal:** Get all 4 frontend apps working with tested backend  
**Estimated Time:** 10 days (2 weeks)

---

## 🎯 OBJECTIVES

1. ✅ All 4 apps start successfully
2. ✅ Authentication works with httpOnly cookies
3. ✅ Patient can create booking and see visits
4. ✅ Nurse can update visits
5. ✅ Doctor can review visits
6. ✅ Admin can manage users
7. ✅ Real-time messaging works
8. ✅ File uploads work
9. ✅ Payment integration complete

---

## 📅 WEEK 1: FOUNDATION & CORE APPS (5 days)

### **Day 1: Setup & Assessment** ✅ TODAY
**Time:** 6 hours

#### Tasks:
- [x] Analyze frontend structure
- [ ] Check all apps exist and have package.json
- [ ] Verify dependencies are installable
- [ ] Check for TypeScript/ESLint errors
- [ ] Identify missing files
- [ ] Create environment templates

**Deliverable:** Assessment report of current frontend state

---

### **Day 2: Authentication Foundation**
**Time:** 6 hours

#### Tasks:
- [ ] Update API client to support cookies
- [ ] Remove localStorage token usage
- [ ] Add CSRF token handling
- [ ] Update login/logout flows
- [ ] Test authentication in one app first
- [ ] Replicate to other 3 apps

**Files to Modify:**
- `apps/admin/src/lib/auth.ts` or similar
- `apps/doctor/src/lib/auth.ts`
- `apps/patient/src/lib/auth.ts`
- `apps/nurse/src/lib/auth.ts`
- Each app's API client

**Deliverable:** Working login/logout in all 4 apps

---

### **Day 3: Patient App - Complete Flow**
**Time:** 8 hours

#### Morning: Core Pages
- [ ] Login page works
- [ ] Registration page works
- [ ] Dashboard shows bookings
- [ ] Create booking form
- [ ] View booking details

#### Afternoon: Integration
- [ ] Connect to POST /api/auth/login
- [ ] Connect to POST /api/auth/register
- [ ] Connect to GET /api/bookings (user bookings)
- [ ] Connect to POST /api/bookings
- [ ] Test complete patient journey

**Deliverable:** Patient can register, login, create booking

---

### **Day 4: Nurse App - Visit Management**
**Time:** 8 hours

#### Morning: Core Pages
- [ ] Login page works
- [ ] Dashboard shows assigned visits
- [ ] Visit detail page
- [ ] Update visit form
- [ ] Upload vitals/reports

#### Afternoon: Integration
- [ ] Connect to GET /api/visits (nurse's visits)
- [ ] Connect to GET /api/visits/:id
- [ ] Connect to PATCH /api/visits/:id/status
- [ ] Connect to POST /api/visits/:id/vitals
- [ ] Test nurse workflow

**Deliverable:** Nurse can see visits, update status, add vitals

---

### **Day 5: Doctor App - Review System**
**Time:** 8 hours

#### Morning: Core Pages
- [ ] Login page works
- [ ] Dashboard shows visits needing review
- [ ] Visit review page
- [ ] Add doctor notes form
- [ ] Approve/reject visit

#### Afternoon: Integration
- [ ] Connect to GET /api/visits (doctor's reviews)
- [ ] Connect to GET /api/visits/:id
- [ ] Connect to POST /api/visits/:id/review
- [ ] Test doctor workflow

**Deliverable:** Doctor can review visits, add notes

---

## 📅 WEEK 2: INTEGRATION & FEATURES (5 days)

### **Day 6: Admin Portal**
**Time:** 8 hours

#### Morning: User Management
- [ ] Login page works
- [ ] User list page
- [ ] Create user form
- [ ] Edit user form
- [ ] Analytics dashboard

#### Afternoon: Integration
- [ ] Connect to GET /api/admin/users
- [ ] Connect to POST /api/admin/users
- [ ] Connect to PUT /api/admin/users/:id
- [ ] Connect to DELETE /api/admin/users/:id
- [ ] Connect to GET /api/admin/stats

**Deliverable:** Admin can manage all users

---

### **Day 7: Real-Time Messaging (All Apps)**
**Time:** 8 hours

#### Morning: Message UI Components
- [ ] Chat message component
- [ ] Message list component
- [ ] Message input component
- [ ] Typing indicator component

#### Afternoon: WebSocket Integration
- [ ] WebSocket connection setup
- [ ] Listen for NEW_MESSAGE events
- [ ] Send messages via WebSocket
- [ ] Update UI on new messages
- [ ] Handle connection errors

**Files to Create:**
- `apps/*/src/lib/websocket.ts`
- `apps/*/src/components/Chat/`

**Deliverable:** Real-time messaging works in all apps

---

### **Day 8: File Upload Integration**
**Time:** 6 hours

#### Tasks:
- [ ] File upload component (reusable)
- [ ] Image preview
- [ ] Progress indicator
- [ ] Connect to POST /api/uploads
- [ ] Display uploaded files
- [ ] Download files

**Deliverable:** File uploads work in all apps

---

### **Day 9: Payment Integration (Paystack)**
**Time:** 8 hours

#### Morning: Backend Completion
- [ ] Complete Paystack service
- [ ] Add webhook handlers
- [ ] Test in Postman

#### Afternoon: Frontend Integration
- [ ] Install @paystack/inline
- [ ] Payment button component
- [ ] Initialize payment
- [ ] Handle success callback
- [ ] Handle failure callback
- [ ] Update UI on payment status

**Deliverable:** End-to-end payment flow works

---

### **Day 10: Testing & Polish**
**Time:** 8 hours

#### Morning: Testing
- [ ] Test patient journey (register → book → pay → chat)
- [ ] Test nurse workflow (login → view visit → update)
- [ ] Test doctor workflow (login → review → approve)
- [ ] Test admin functions (create users, view stats)
- [ ] Test across browsers
- [ ] Test responsive design

#### Afternoon: Bug Fixes & Polish
- [ ] Fix any bugs found
- [ ] Improve error messages
- [ ] Add loading states
- [ ] Improve UI/UX
- [ ] Add success notifications

**Deliverable:** Polished, working application

---

## 🛠️ TECHNICAL APPROACH

### **App Structure** (Expected):
```
apps/
├── admin/          # Admin Portal (Next.js)
│   ├── src/
│   │   ├── app/    # Next.js 13+ App Router
│   │   ├── components/
│   │   ├── lib/    # API client, auth, utils
│   │   └── hooks/
│   ├── package.json
│   └── .env.local
├── doctor/         # Doctor Portal
├── nurse/          # Nurse App
└── patient/        # Patient App
```

### **Key Files to Create/Modify:**

#### 1. **API Client** (`src/lib/api.ts`)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Important for cookies!
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

#### 2. **Auth Context** (`src/contexts/AuthContext.tsx`)
```typescript
// Remove localStorage usage
// Use cookies instead
// Add CSRF token handling
```

#### 3. **Environment Variables** (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
```

---

## 📊 SUCCESS METRICS

### **End of Week 1:**
- [ ] All 4 apps start without errors
- [ ] Login works in all apps
- [ ] Patient can create booking
- [ ] Nurse can view visits
- [ ] Doctor can see reviews needed

### **End of Week 2:**
- [ ] Complete patient journey works
- [ ] Messaging is real-time
- [ ] Files can be uploaded
- [ ] Payment flow complete
- [ ] All user roles functional

---

## 🚨 RISKS & MITIGATION

### Risk 1: Frontend Apps Don't Exist or Incomplete
**Probability:** Medium  
**Impact:** High  
**Mitigation:** 
- Check structure first
- Build missing pages from scratch
- Use tested backend as API spec

### Risk 2: Dependencies Incompatible
**Probability:** Low  
**Impact:** Medium  
**Mitigation:**
- Update to latest stable versions
- Use package-lock.json if exists
- Fresh install if needed

### Risk 3: WebSocket Connection Issues
**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- Test WebSocket separately first
- Add robust error handling
- Implement reconnection logic

---

## 🎯 IMMEDIATE NEXT STEPS

### **Step 1: Assess Frontend Structure** (NOW)
```bash
# Check what exists
ls apps/
ls apps/admin/
ls apps/doctor/
ls apps/patient/
ls apps/nurse/

# Check package.json exists
cat apps/admin/package.json
cat apps/doctor/package.json
cat apps/patient/package.json
cat apps/nurse/package.json
```

### **Step 2: Try Starting One App**
```bash
cd apps/admin
npm install
npm run dev
```

### **Step 3: Fix Issues Found**
- Missing dependencies
- Configuration errors
- Build errors
- TypeScript errors

---

## 📝 PROGRESS TRACKING

### Daily Checklist:
- [ ] Day 1: Assessment ✅ Starting now
- [ ] Day 2: Authentication
- [ ] Day 3: Patient App
- [ ] Day 4: Nurse App
- [ ] Day 5: Doctor App
- [ ] Day 6: Admin Portal
- [ ] Day 7: Messaging
- [ ] Day 8: File Upload
- [ ] Day 9: Payment
- [ ] Day 10: Testing

---

## 🎉 FINAL DELIVERABLE

At the end of 10 days, you will have:

✅ **4 Working Frontend Applications**
- Admin Portal (user management, analytics)
- Doctor Portal (visit reviews, consultations)
- Patient App (booking, payments, messaging)
- Nurse App (visit updates, vitals, reports)

✅ **Complete Features**
- Authentication with httpOnly cookies
- Real-time messaging
- File uploads
- Payment processing
- Role-based access control

✅ **Tested & Ready**
- All user journeys tested
- Cross-browser compatible
- Responsive design
- Error handling

---

**Ready to start? Let's check the frontend structure!** 🚀

---

**Created:** October 15, 2024  
**Status:** In Progress  
**Current Phase:** Day 1 - Assessment

