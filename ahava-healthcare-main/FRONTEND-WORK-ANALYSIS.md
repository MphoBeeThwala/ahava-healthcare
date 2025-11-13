Frontend work analysis and planning

Date: October 15, 2024. Backend development has advanced ahead of schedule: the test suite covers 179 scenarios (about 28 percent of the codebase), GitHub Actions automates tests on every push and pull request, messaging, file uploads, visit management, and BullMQ background tasks are all complete, and security features (JWT authentication, httpOnly cookies on the server, rate limiting, validation, encryption) are in place. Remaining backend items from the original Week 3-4 roadmap include front-end adoption of httpOnly cookies, WebSocket security refinements, Paystack payment flows, webhook handlers, and API documentation.

Four frontend applications exist in the monorepo (`apps/admin`, `apps/doctor`, `apps/patient`, `apps/nurse`), each built with Next.js, React, and TypeScript. The next stage centres on integrating these portals with the tested backend and polishing user flows.

Priority tasks:
1. Authentication alignment: remove localStorage token usage in each portal’s auth context and API client, rely entirely on httpOnly cookies, handle CSRF if required, and confirm login/logout flows interact correctly with `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout`.
2. Environment setup: create `.env.local` files for every app with `NEXT_PUBLIC_API_URL=http://localhost:4000` and `NEXT_PUBLIC_WS_URL=ws://localhost:4000` (plus Paystack keys where needed).
3. Boot verification: install dependencies (`npm install` per app), run each app locally, fix startup errors, and confirm navigation works.
4. Feature wiring: connect admin dashboards (user management, visits, payments, analytics), patient booking flows (registration, booking, visit tracking, uploads, messaging, payments), nurse workflows (assigned visits, status updates, triage capture, reports, chat), and doctor workflows (visit review, AI insights, diagnosis, prescriptions, follow-up scheduling, chat).
5. Real-time behaviour: integrate WebSocket listeners for visit status changes, new messages, typing indicators, and AI analysis completion; provide resilience for disconnections.
6. Payment integration: embed Paystack on the patient app, handle callbacks, reflect payment status in the UI.
7. Testing and UX polish: add component and integration tests using React Testing Library/Cypress, ensure responsive layouts, add loading states and error handling, and validate accessibility.

The recommended execution approach focuses on frontend integration: dedicate the first days to authentication updates, environment configuration, dependency installs, and verifying each portal boots. Complete the patient booking flow end to end, replicate patterns to nurse, doctor, and admin apps, then layer in real-time messaging and payments. This delivers user-facing progress quickly while backend stability is assured and reveals integration gaps early.

Report prepared by Mpho Thwala on behalf of Ahava on 88 Company.
