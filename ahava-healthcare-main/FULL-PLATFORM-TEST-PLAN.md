Full platform test plan

Date: December 2024
Status: in progress
Goal: achieve comprehensive testing across every component of the Ahava Healthcare platform.

Current test status stands at one hundred seventy nine automated checks, covering utilities (twenty six tests for health, encryption, cookies, logging), API mock suites (one hundred twenty seven tests that exercise auth, admin, bookings, visits, payments, messaging), and integration checks (twenty six tests validating authentication with the database). Missing coverage includes middleware, services, workers, webhooks, end-to-end flows, and security scenarios.

Coverage goals: raise routes from thirty one point nine three percent to eighty five percent, middleware from thirty seven point seven eight to ninety, services from zero to eighty, workers from zero to seventy five, utilities from sixty eight point two one to ninety, and overall from twenty three point three five to eighty percent.

Test categories to implement:
1. Middleware (high priority). Tasks include thorough authentication middleware tests (valid/invalid tokens, expirations, missing tokens, inactive users, role gating, cookie and header handling); rate limiting (general API, auth, registration, webhook thresholds, lockouts, headers, test exclusions); error handling (Prisma errors, JWT errors, validation, 404, 500, logging, environment-specific messaging); CSRF protection (token issuance, validation, expiry, method exemptions, webhook bypass); and file uploads (type and size validation, storage paths, URL generation, error handling).
2. Services (high priority). Payment service should cover initialization, verification, status updates, refunds, history, booking associations, errors. Paystack service needs payment flow tests, webhook verification, refunds, status checks, error handling. Queue service should validate job lifecycle and failures; Redis service should confirm connectivity, caching, expiration, reconnection. WebSocket service requires connection, broadcasting, targeted messages, auth, disconnect, errors. AI diagnosis service needs request processing, symptom analysis, output formatting, errors, rate limiting.
3. Workers (medium priority). Email worker tests for sending, templates, retries. PDF worker for generation, templates, storage, errors. Push worker for notifications, device validation, retries, queue processing.
4. Integration (high priority). Full user flows (patient booking to visit to messaging, nurse updates, doctor diagnoses, admin oversight), payment flows (booking to Paystack to webhook to confirmation, refunds, failure handling), and messaging flows (encryption, WebSocket delivery, attachments, group channels).
5. Webhooks (high priority). Paystack events including charge success/failure, transfer, refunds, and invalid signature handling.
6. Security (high priority). Exercises to ensure SQL injection, XSS, CSRF, rate limiting, authentication bypass, authorization checks, input validation, and encryption remain hardened.

Implementation plan:
- Phase 1 (Day 1): middleware tests. Create auth.test.ts (15 tests), rateLimiter.test.ts (12), errorHandler.test.ts (10), csrf.test.ts (10), upload.test.ts (8). Target: fifty five new tests to reach eighty five percent middleware coverage.
- Phase 2 (Day 2): service tests. Create payment.test.ts (10), paystack.test.ts (8), queue.test.ts (8), redis.test.ts (8), websocket.test.ts (10), ai-diagnosis.test.ts (6). Target: fifty new tests, eighty percent service coverage.
- Phase 3 (Day 3): worker tests. Create emailWorker.test.ts, pdfWorker.test.ts, pushWorker.test.ts (eight tests each). Target: twenty four new tests, seventy five percent worker coverage.
- Phase 4 (Day 4): integration tests. Create flows.test.ts (20 tests), payment-flow.test.ts (10), messaging-flow.test.ts (10). Target: forty new tests covering critical flows.
- Phase 5 (Day 5): webhook and security tests. Build webhooks.test.ts (10) and security.test.ts (15). Target: twenty five new tests with emphasis on compliance.

Expected result after all phases: total automated suite grows to three hundred seventy four tests (one hundred seventy nine existing plus one hundred ninety five new) across more than twenty five suites, delivering about eighty percent overall coverage (routes 85, middleware 90, services 80, workers 75, utilities 90).

Test infrastructure setup: create a dedicated test database (`createdb ahava-healthcare-test -U ahava_user`), run migrations with DATABASE_URL pointing to the test instance (`npx prisma migrate deploy`). Commands include `yarn test`, `yarn test --coverage`, and suite-specific runs (`yarn test auth`, `yarn test middleware`, etc.). Watch mode via `yarn test:watch`.

Success criteria: every middleware component ≥90 percent coverage, services ≥80, workers ≥75, full end-to-end flows validated, security features covered, webhook handlers tested, overall coverage above eighty percent, and a one hundred percent pass rate.

Notes: keep tests isolated with a dedicated database, mock external dependencies (Paystack, email), clean up data after each case, use factories for data generation, and test both success and failure paths along with edges and boundary conditions.

Test plan documented by Mpho Thwala on behalf of Ahava on 88 Company.

