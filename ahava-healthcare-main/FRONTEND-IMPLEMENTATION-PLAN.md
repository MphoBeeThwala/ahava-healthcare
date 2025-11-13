Frontend implementation plan

Context: October 15, 2025. The frontend workstream spans four Next.js portals (admin, doctor, nurse, patient). This plan assumes the backend API, database schema, and authentication flows already exist. The goal is to finish feature integration, align UI with the design system, and ensure each portal supports end-to-end workflows.

Scope overview:
- Admin portal handles onboarding, visit management, payments, analytics, staff assignment, content management, and audit exports.
- Doctor portal supports clinical review, AI analysis, nurse collaboration, prescription creation, follow-up scheduling, and quality checks.
- Nurse portal manages daily visit assignments, GPS tracking, triage capture, messaging, report uploads, and status updates.
- Patient portal provides booking, scheduling, payment flows, visit tracking, messaging, AI insights, and profile management.

Implementation phases:
1. Baseline alignment
   - Sync Tailwind config, typography, and color palette with the latest design tokens.
   - Ensure shared components (buttons, forms, modals, tables) live in a common package to reduce duplication.
   - Create `.env.local` files in every portal with `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` pointing to the backend.
   - Run dependency installs and upgrade Next.js/TypeScript/Tailwind if necessary.

2. Authentication hardening
   - Remove any token storage in localStorage; rely on httpOnly cookies for session persistence.
   - Confirm login pages submit credentials to `/api/auth/login`, handle 401 responses, and redirect to dashboards on success.
   - Implement `checkAuth` hooks to fetch the current user via `/api/auth/me` and redirect unauthenticated visitors to `/login`.
   - Ensure logout clears client state and triggers `/api/auth/logout`.

3. Core feature wiring per portal
   Admin portal tasks:
   - Dashboard: fetch metrics (users, visits, revenue) with aggregated endpoints.
   - User management: list, filter, view, and update users; reset credentials; change status.
   - Visits: visualize visit pipeline, update statuses, assign clinicians, trigger reassignments.
   - Payments: view transactions, refunds, and settlement status.
   - Analytics: charts for visit volume, conversion rates, payment mix.
   - Settings: configure system values (service areas, pricing tiers).

   Doctor portal tasks:
   - Visit queue: list assigned visits with statuses and filters (scheduled, in progress, completed).
   - Visit detail: display patient history, AI summaries, nurse reports, uploads, chat transcript.
   - Triage integration: highlight nurse triage data and allow comments.
   - Diagnosis form: capture final diagnosis, prescriptions, follow-up plans, and ratings.
   - Messaging: integrate WebSocket channel for doctor–nurse/patient communication.

   Nurse portal tasks:
   - Daily agenda: show today’s visits in chronological order with location and contact info.
   - Navigation: provide quick links to mapping applications using coordinates.
   - Status updates: transitions for SCHEDULED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED.
   - Triage form: collect vital signs, assessments, photos, attachments.
   - Reporting: allow uploading PDF or images for post-visit reports.
   - Messaging: real-time chat with patient and doctor; show read receipts.

   Patient portal tasks:
   - Booking wizard: capture service type, preferred date/time, address, notes, payment method.
   - Payment integration: embed Paystack for card payments; handle success and failure callbacks.
   - Visit timeline: show nurse ETA, current status, triage notes, doctor diagnosis.
   - Messaging: secure chat with assigned nurse/doctor.
   - History: list past visits, invoices, follow-ups.
   - Profile: update contact info, emergency contacts, notification settings.

4. Real-time and offline considerations
   - Establish a WebSocket client that authenticates with the backend token and joins visit-specific channels.
   - Listen for visit status updates, new messages, AI analysis completions, and payment confirmations.
   - Surface toast notifications for live events; maintain optimistic UI updates for status changes.
   - Implement graceful fallback when WebSocket disconnects (retry logic, offline banners).

5. Accessibility, internationalisation, and responsive polish
   - Ensure WCAG 2.1 AA compliance: focus states, ARIA labels, semantic markup.
   - Verify responsive behavior for tablets and mobile (especially patient/nurse flows).
   - Provide optional dark mode toggle if time permits; otherwise ensure colors have sufficient contrast.
   - Prepare for localisation (store copy in configuration objects, use i18n ready patterns).

6. Testing strategy
   - Unit tests for shared components (buttons, forms, hooks).
   - Integration tests for key workflows (admin creating user, patient booking, nurse updating triage, doctor finalising diagnosis).
   - Cypress or Playwright smoke tests for login and navigation.
   - Manual exploratory sessions following the quick testing guide.

7. Deployment readiness
   - Configure linting and type checking in CI.
   - Ensure build scripts produce production-ready Next.js output for each portal.
   - Document environment variables in `ENV-SETUP-GUIDE.md`.
   - Coordinate with backend team on release schedule, staging verification, and rollback procedures.

Dependencies and cross-team coordination:
- Confirm API endpoints, payloads, and authentication behavior with the backend team.
- Align on branding assets and copy with design/product stakeholders.
- Plan UAT sessions for each persona (admin, doctor, nurse, patient).

Next steps: continue executing against each portal’s feature backlog in the order above, verifying completion through automated tests and manual walkthroughs. Once all portals reach parity, conduct full end-to-end rehearsals covering booking through diagnosis and payment. Plan authored by Mpho Thwala on behalf of Ahava on 88 Company.
