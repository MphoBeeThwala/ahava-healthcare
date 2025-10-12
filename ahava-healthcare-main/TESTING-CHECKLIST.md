# 🧪 Security Fixes Testing Checklist

## Overview

This checklist helps verify that all Week 1-2 security fixes are working correctly before moving to the next phase.

---

## 1. Encryption Tests

### Test 1.1: Basic Encryption/Decryption
```bash
# Create a test script
node -e "
const { encryptData, decryptData } = require('./apps/backend/src/utils/encryption.ts');
const plaintext = 'Sensitive patient data';
const encrypted = encryptData(plaintext);
const decrypted = decryptData(encrypted);
console.log('Encryption test:', decrypted === plaintext ? 'PASS' : 'FAIL');
"
```

- [ ] Encryption successfully encrypts data
- [ ] Decryption returns original data
- [ ] Encrypted data format: `iv:authTag:encrypted`

### Test 1.2: Encryption Validation
- [ ] Empty string throws error
- [ ] Invalid key length throws error
- [ ] Tampered encrypted data throws error

---

## 2. Authentication & Authorization Tests

### Test 2.1: Password Validation
```bash
# Test weak password (should fail)
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "password": "weak123",
    "firstName": "Test",
    "lastName": "User",
    "role": "PATIENT"
  }'
```

- [ ] Password < 12 chars rejected
- [ ] Password without uppercase rejected
- [ ] Password without lowercase rejected
- [ ] Password without number rejected
- [ ] Password without special char rejected
- [ ] Clear error message displayed

### Test 2.2: Strong Password (should succeed)
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "StrongP@ssw0rd123",
    "firstName": "Test",
    "lastName": "User",
    "role": "PATIENT"
  }'
```

- [ ] Registration successful
- [ ] User created in database
- [ ] Access token received
- [ ] Refresh token received

---

## 3. Role-Based Access Control Tests

### Test 3.1: Admin Routes - Non-Admin User
```bash
# Login as non-admin user
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "StrongP@ssw0rd123"
  }'

# Try to access admin route with patient token
curl -X GET http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer <PATIENT_TOKEN>"
```

- [ ] Returns 403 Forbidden
- [ ] Error message: "Insufficient permissions"

### Test 3.2: Admin Routes - Admin User
```bash
# Create admin user manually or use test admin
curl -X GET http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

- [ ] Returns 200 OK
- [ ] User list displayed
- [ ] Pagination included

### Test 3.3: Admin Statistics
```bash
curl -X GET http://localhost:4000/api/admin/stats/overview \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

- [ ] Returns statistics
- [ ] User counts displayed
- [ ] Visit counts displayed

---

## 4. Account Lockout Tests

### Test 4.1: Failed Login Attempts
```bash
# Attempt 1-5: Wrong password
for i in {1..5}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test2@example.com",
      "password": "WrongPassword123!"
    }'
  echo "\nAttempt $i"
done
```

- [ ] First 4 attempts return "Invalid credentials"
- [ ] 5th attempt returns "Invalid credentials"
- [ ] Account lockout triggered

### Test 4.2: Lockout Enforcement
```bash
# Attempt 6: Correct password
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "StrongP@ssw0rd123"
  }'
```

- [ ] Returns 423 Locked
- [ ] Error message includes lockout duration
- [ ] Lockout time displayed

### Test 4.3: Lockout Expiration
- [ ] Wait 30 minutes (or modify timeout for testing)
- [ ] Login successful after lockout expires
- [ ] Failed attempts counter reset

---

## 5. Rate Limiting Tests

### Test 5.1: Registration Rate Limit
```bash
# Attempt 4 registrations in quick succession
for i in {1..4}; do
  curl -X POST http://localhost:4000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"user$i@example.com\",
      \"password\": \"StrongP@ssw0rd123\",
      \"firstName\": \"User\",
      \"lastName\": \"$i\",
      \"role\": \"PATIENT\"
    }"
  echo "\nRegistration $i"
done
```

- [ ] First 3 registrations succeed
- [ ] 4th registration returns 429 Too Many Requests
- [ ] Error message: "Too many registration attempts"

### Test 5.2: API Rate Limit
```bash
# Make 101 requests to any API endpoint
for i in {1..101}; do
  curl -X GET http://localhost:4000/health
done
```

- [ ] First 100 requests succeed (actually more since health is exempt)
- [ ] Test with different endpoint if needed
- [ ] 101st request returns 429

---

## 6. CSRF Protection Tests

### Test 6.1: Get CSRF Token
```bash
curl -X GET http://localhost:4000/api/auth/csrf-token
```

- [ ] Returns CSRF token
- [ ] Token is 64-character hex string

### Test 6.2: POST Without CSRF Token
```bash
# Attempt state-changing operation without CSRF token
curl -X POST http://localhost:4000/api/bookings \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledDate": "2025-12-01T10:00:00Z",
    "paymentMethod": "CARD",
    "amountInCents": 50000
  }'
```

- [ ] Request currently succeeds (CSRF not enforced on Bearer token requests)
- [ ] This is expected behavior for API clients

### Test 6.3: CSRF with Non-API Request
- [ ] Frontend form submission without token should fail
- [ ] Including valid token should succeed

---

## 7. Input Validation Tests

### Test 7.1: Admin Create User - Invalid Data
```bash
curl -X POST http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "short",
    "firstName": "A",
    "lastName": "B",
    "role": "INVALID_ROLE"
  }'
```

- [ ] Returns 400 Bad Request
- [ ] Specific validation error message
- [ ] No user created

### Test 7.2: Payment - Invalid Amount
```bash
curl -X POST http://localhost:4000/api/payments \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "visitId": "test-visit-id",
    "amountInCents": -1000,
    "currency": "USD"
  }'
```

- [ ] Negative amount rejected
- [ ] Invalid currency rejected
- [ ] Missing visitId rejected

### Test 7.3: Phone Number Validation
```bash
curl -X POST http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongP@ssw0rd123",
    "firstName": "Test",
    "lastName": "User",
    "role": "PATIENT",
    "phone": "0123456789"
  }'
```

- [ ] Invalid phone format rejected
- [ ] Must be +27XXXXXXXXX format
- [ ] Valid format (+27812345678) accepted

---

## 8. Logging Tests

### Test 8.1: Log File Creation
```bash
# Start server and check logs directory
ls -la apps/backend/logs/
```

- [ ] Logs directory exists
- [ ] Log file created: `app-YYYY-MM-DD.log`
- [ ] File contains JSON entries

### Test 8.2: Log Levels
```bash
# Check different log levels are working
tail -f apps/backend/logs/app-$(date +%Y-%m-%d).log
```

- [ ] INFO level logs server startup
- [ ] ERROR level logs errors
- [ ] SECURITY level logs security events
- [ ] Each entry has timestamp
- [ ] Each entry is valid JSON

### Test 8.3: Security Event Logging
```bash
# Trigger security events and check logs
# 1. Failed login
# 2. CSRF failure
# 3. JWT validation failure
```

- [ ] Failed login attempt logged
- [ ] IP address included
- [ ] User email included (if applicable)
- [ ] Event type clearly identified

---

## 9. Error Handling Tests

### Test 9.1: Production Error Messages
```bash
# Set NODE_ENV=production and trigger error
NODE_ENV=production npm start

# Trigger database error (invalid ID)
curl -X GET http://localhost:4000/api/payments/invalid-id \
  -H "Authorization: Bearer <TOKEN>"
```

- [ ] Generic error message in response
- [ ] No stack trace in response
- [ ] No internal details exposed
- [ ] Full error logged internally

### Test 9.2: Development Error Messages
```bash
# Set NODE_ENV=development
NODE_ENV=development npm start

# Same error as above
```

- [ ] Detailed error message in response
- [ ] Stack trace included
- [ ] Helpful debugging information

### Test 9.3: 404 Handling
```bash
curl -X GET http://localhost:4000/nonexistent-route
```

- [ ] Returns 404
- [ ] JSON response
- [ ] Error message: "The requested resource was not found"
- [ ] Logged as warning

---

## 10. Payment Route Security Tests

### Test 10.1: Payment Access Control
```bash
# Create payment as patient (should fail)
curl -X POST http://localhost:4000/api/payments \
  -H "Authorization: Bearer <PATIENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "visitId": "test-visit",
    "amountInCents": 50000
  }'
```

- [ ] Returns 403 Forbidden
- [ ] Only admin can create payments

### Test 10.2: View Own Payments Only
```bash
# Patient A views payments
curl -X GET http://localhost:4000/api/payments \
  -H "Authorization: Bearer <PATIENT_A_TOKEN>"
```

- [ ] Only Patient A's payments returned
- [ ] Other patients' payments not visible

---

## Summary Checklist

### Critical Tests (Must Pass)
- [ ] Encryption works correctly
- [ ] Password validation enforces strong passwords
- [ ] Admin routes protected from non-admins
- [ ] Account lockout prevents brute force
- [ ] Input validation prevents bad data
- [ ] Error messages don't leak sensitive info

### Important Tests (Should Pass)
- [ ] Rate limiting works
- [ ] CSRF protection functional
- [ ] Logging system operational
- [ ] Payment routes secured

### Optional Tests (Nice to Have)
- [ ] Log file rotation
- [ ] Performance under load
- [ ] WebSocket security
- [ ] Token storage security (frontend)

---

## Testing Commands Summary

```bash
# Start the server
cd ahava-healthcare-main/apps/backend
npm run dev

# In another terminal, run tests
cd ahava-healthcare-main

# 1. Test weak password
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"weak","firstName":"Test","lastName":"User","role":"PATIENT"}'

# 2. Test strong password
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@test.com","password":"StrongP@ssw0rd123","firstName":"Test","lastName":"User","role":"PATIENT"}'

# 3. Login and get token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@test.com","password":"StrongP@ssw0rd123"}'

# 4. Test admin route (should fail with patient token)
curl -X GET http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer <PATIENT_TOKEN>"

# 5. Check logs
cat apps/backend/logs/app-$(date +%Y-%m-%d).log | jq
```

---

## Sign-Off

Once all critical tests pass, you're ready to proceed to Week 3-4!

- [ ] All critical tests passed
- [ ] All important tests passed
- [ ] Documentation reviewed
- [ ] Code reviewed
- [ ] Ready for next phase

**Tested By**: _________________  
**Date**: _________________  
**Status**: ☐ APPROVED ☐ NEEDS WORK


