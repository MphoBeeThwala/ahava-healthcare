# Security Documentation

## Overview

This document outlines the security measures implemented in the Ahava Healthcare platform to protect sensitive patient data and ensure HIPAA compliance.

## Week 1-2 Security Fixes Implementation Summary

### ✅ Completed Security Enhancements

#### 1. **Encryption (CRITICAL - FIXED)**
- **Issue**: Deprecated `crypto.createCipher` functions used
- **Fix**: Implemented proper AES-256-GCM encryption with:
  - `crypto.createCipheriv` / `createDecipheriv` (secure APIs)
  - Random IV generation for each encryption operation
  - Authentication tags for data integrity verification
  - Proper key validation and error handling
- **File**: `apps/backend/src/utils/encryption.ts`

#### 2. **Role-Based Access Control (HIGH - FIXED)**
- **Issue**: Admin routes accessible by any authenticated user
- **Fix**: Implemented strict RBAC:
  - `requireAdmin` middleware on all admin endpoints
  - Role-specific access checks for all routes
  - Authorization validation before data access
  - Soft delete instead of hard delete for user deactivation
- **Files**: 
  - `apps/backend/src/routes/admin.ts`
  - `apps/backend/src/routes/payments.ts`
  - `apps/backend/src/middleware/auth.ts`

#### 3. **Password Security (HIGH - FIXED)**
- **Issue**: Weak password requirements (only 8 chars)
- **Fix**: Strong password policy:
  - Minimum 12 characters
  - Must contain uppercase, lowercase, number, and special character
  - Pattern validation via Joi
  - Clear error messages for password requirements
- **File**: `apps/backend/src/routes/auth.ts`

#### 4. **Account Lockout Mechanism (MEDIUM - FIXED)**
- **Issue**: No protection against brute force attacks
- **Fix**: Implemented account lockout:
  - 5 failed attempts trigger 30-minute lockout
  - Email-based attempt tracking
  - Automatic lockout expiration
  - Clear lockout messages with remaining time
- **File**: `apps/backend/src/middleware/rateLimiter.ts`

#### 5. **Enhanced Rate Limiting (MEDIUM - FIXED)**
- **Issue**: Rate limits too permissive
- **Fix**: Granular rate limiting:
  - Registration: 3 attempts per hour per IP
  - Login: 5 attempts per 15 minutes per IP (only failed requests counted)
  - General API: 100 requests per 15 minutes per IP
  - Webhooks: 50 requests per minute per IP
- **File**: `apps/backend/src/middleware/rateLimiter.ts`

#### 6. **Input Validation (HIGH - FIXED)**
- **Issue**: Admin/payment routes accepting raw request body
- **Fix**: Comprehensive Joi validation schemas:
  - All admin endpoints validated
  - All payment endpoints validated
  - Phone number format validation (South African: +27XXXXXXXXX)
  - Amount limits and currency validation
  - Date validation
- **Files**:
  - `apps/backend/src/routes/admin.ts`
  - `apps/backend/src/routes/payments.ts`

#### 7. **CSRF Protection (MEDIUM - FIXED)**
- **Issue**: No CSRF protection implemented
- **Fix**: Custom CSRF middleware:
  - Token generation and validation
  - Conditional CSRF (skipped for API tokens)
  - Token expiration (1 hour)
  - Security event logging
- **Files**:
  - `apps/backend/src/middleware/csrf.ts`
  - `apps/backend/src/routes/auth.ts` (token endpoint)

#### 8. **Logging System (MEDIUM - FIXED)**
- **Issue**: console.log statements throughout codebase
- **Fix**: Structured logging system:
  - File-based logging with daily rotation
  - Log levels (DEBUG, INFO, WARN, ERROR, SECURITY)
  - Separate security event logging
  - Development vs production modes
  - Request/response logging
- **File**: `apps/backend/src/utils/logger.ts`

#### 9. **Error Handling (MEDIUM - FIXED)**
- **Issue**: Error messages leaking internal details
- **Fix**: Sanitized error responses:
  - Generic messages in production
  - Detailed logging internally
  - Prisma error translation
  - JWT error sanitization
  - Stack traces only in development
- **File**: `apps/backend/src/middleware/errorHandler.ts`

## Security Features

### Authentication & Authorization

#### JWT Tokens
- **Access Tokens**: 15-minute expiration
- **Refresh Tokens**: 7-day expiration, stored in database
- **Token Rotation**: New refresh token issued on each refresh
- **Token Invalidation**: Logout removes refresh token from database

#### Password Security
- **Hashing**: bcrypt with 12 salt rounds
- **Requirements**: 
  - Minimum 12 characters
  - Mixed case letters
  - Numbers
  - Special characters (@$!%*?&)

#### Role-Based Access Control
- **Roles**: PATIENT, NURSE, DOCTOR, ADMIN
- **Middleware**: `requireAdmin`, `requireDoctor`, `requireNurse`, `requirePatient`
- **Enforcement**: Applied to all protected routes

### Data Encryption

#### At Rest
- **Algorithm**: AES-256-GCM
- **Key Management**: 32-byte key stored in environment variables
- **IV**: Randomly generated for each encryption
- **Authentication**: GCM authentication tags prevent tampering
- **Fields Encrypted**:
  - Patient addresses
  - ID numbers
  - Medical reports
  - Messages

#### In Transit
- **HTTPS**: Required in production (configure reverse proxy)
- **TLS 1.2+**: Minimum version recommended

### Rate Limiting & DDoS Protection

| Endpoint Type | Rate Limit | Window | Notes |
|--------------|------------|--------|--------|
| Registration | 3 requests | 1 hour | Per IP |
| Login | 5 requests | 15 minutes | Failed attempts only |
| General API | 100 requests | 15 minutes | Per IP, skips health check |
| Webhooks | 50 requests | 1 minute | Per IP |

### Account Security

#### Account Lockout
- **Threshold**: 5 failed login attempts
- **Duration**: 30 minutes
- **Scope**: Per email address
- **Notifications**: Clear error messages with remaining time

#### Session Management
- **Timeout**: Access tokens expire after 15 minutes
- **Refresh**: Refresh tokens valid for 7 days
- **Revocation**: Logout invalidates refresh token

### CSRF Protection

#### Implementation
- **Token Generation**: 32-byte random tokens
- **Storage**: Server-side storage (migrate to Redis for production)
- **Validation**: Required for state-changing operations (POST, PUT, DELETE, PATCH)
- **Exceptions**: 
  - Safe methods (GET, HEAD, OPTIONS)
  - Webhooks
  - API requests with Bearer tokens

#### Usage
```javascript
// Get CSRF token
GET /api/auth/csrf-token

// Include in requests
POST /api/resource
Headers: {
  'X-CSRF-Token': 'token_value'
}
```

### Logging & Monitoring

#### Log Levels
- **DEBUG**: Development debugging information
- **INFO**: General informational messages
- **WARN**: Warning messages
- **ERROR**: Error conditions
- **SECURITY**: Security-related events

#### Security Events Logged
- Failed login attempts
- Account lockouts
- CSRF token failures
- JWT validation failures
- Unauthorized access attempts
- Admin operations

#### Log Storage
- **Location**: `logs/app-YYYY-MM-DD.log`
- **Format**: JSON (structured logging)
- **Rotation**: Daily
- **Retention**: Configure based on compliance requirements

### Error Handling

#### Production Mode
- **Generic Messages**: Don't expose internal details
- **Status Codes**: Proper HTTP status codes
- **Logging**: Full error details logged internally

#### Development Mode
- **Detailed Errors**: Stack traces included
- **Debug Info**: Additional error metadata
- **Console Output**: Colored console logging

## Security Best Practices

### For Developers

1. **Never log sensitive data**: Passwords, tokens, encryption keys
2. **Use parameterized queries**: Prisma ORM prevents SQL injection
3. **Validate all inputs**: Use Joi schemas for validation
4. **Handle errors gracefully**: Use error middleware
5. **Follow principle of least privilege**: Assign minimum required roles
6. **Keep dependencies updated**: Regularly update npm packages

### For Deployment

1. **Environment Variables**:
   ```bash
   JWT_SECRET=<strong-random-32-char-string>
   ENCRYPTION_KEY=<base64-encoded-32-byte-key>
   NODE_ENV=production
   ```

2. **HTTPS Configuration**:
   - Use reverse proxy (Nginx, Caddy)
   - Enable HTTP Strict Transport Security (HSTS)
   - Configure secure cookie flags

3. **Database Security**:
   - Use strong database passwords
   - Restrict database network access
   - Enable database encryption
   - Regular backups

4. **Monitoring**:
   - Set up log aggregation
   - Configure alerts for security events
   - Monitor failed login attempts
   - Track API error rates

## Remaining Security Tasks

### High Priority
- [ ] Implement secure token storage (httpOnly cookies)
- [ ] Add Content Security Policy headers
- [ ] Implement API request signing
- [ ] Add IP whitelisting for admin panel
- [ ] Set up automated security scanning

### Medium Priority
- [ ] Implement 2FA/MFA for admin users
- [ ] Add security headers (X-Frame-Options, etc.)
- [ ] Implement audit logging for all admin actions
- [ ] Add data retention policies
- [ ] Create security incident response plan

### Low Priority
- [ ] Implement passwordless authentication
- [ ] Add biometric authentication support
- [ ] Create security training materials
- [ ] Conduct penetration testing
- [ ] Obtain security certifications (HIPAA, etc.)

## Compliance Considerations

### HIPAA Compliance
- **Encryption**: ✅ PHI encrypted at rest and in transit
- **Access Controls**: ✅ Role-based access implemented
- **Audit Logging**: ✅ Security events logged
- **Authentication**: ✅ Strong authentication required
- **Data Integrity**: ✅ Encryption authentication tags
- **Automatic Logoff**: ⚠️ Implement session timeout
- **Breach Notification**: ⚠️ Create incident response plan

### POPIA Compliance (South Africa)
- **Lawful Processing**: ✅ Consent-based system
- **Purpose Specification**: Document in privacy policy
- **Data Minimization**: Only collect necessary data
- **Data Subject Rights**: Implement data export/deletion
- **Security Measures**: ✅ Comprehensive security implemented
- **Cross-Border Transfer**: Configure if applicable

## Security Contacts

For security issues:
- **Email**: security@ahavahealthcare.co.za
- **Response Time**: Within 24 hours
- **Encryption**: PGP key available on request

## Change Log

### 2025-10-09 - Week 1-2 Security Fixes
- ✅ Fixed critical encryption vulnerability
- ✅ Implemented RBAC on admin routes
- ✅ Enhanced password requirements
- ✅ Added account lockout mechanism
- ✅ Implemented CSRF protection
- ✅ Created structured logging system
- ✅ Improved error handling
- ✅ Added comprehensive input validation
- ✅ Enhanced rate limiting

---

**Last Updated**: October 9, 2025
**Version**: 1.0.0
**Status**: Week 1-2 Security Fixes Complete


