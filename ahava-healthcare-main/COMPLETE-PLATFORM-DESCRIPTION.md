Complete platform description

Executive summary: Ahava Healthcare delivers a fully integrated home healthcare platform tailored for South Africa. Patients schedule at-home care, nurses manage visits and triage, doctors review cases remotely, and administrators oversee operations. Real-time messaging, GPS tracking, AI-assisted analysis, payment processing through Paystack, and comprehensive audit trails make the system production ready.

Platform purpose and users: The platform removes friction in coordinating care among patients, nurses, and doctors. Patients request visits, upload images, and review outcomes. Nurses receive assignments, capture triage data, and update progress. Doctors consult remotely, run AI analyses, and record final diagnoses. Administrators manage users, verify compliance, and coordinate operations. Typical use cases include post-surgery recovery, chronic condition management, elderly care, and urgent home visits.

High-level architecture: Everything lives in a monorepo. Four Next.js portals (admin on port 3000, doctor on 3001, patient on 3002, nurse on 3003) call a shared Express API on port 4000. PostgreSQL (Supabase in cloud deployments) acts as the system of record. Redis (Upstash in production) powers caching, job queues, and WebSocket coordination. BullMQ workers run background tasks such as email, messaging notifications, AI preprocessing, and audit exports. File storage currently uses the local filesystem (`/uploads`) but can be swapped for S3-compatible storage. Docker Compose orchestrates the full stack locally, and GitHub Actions provides CI/CD.

Architecture diagram (textual representation):
```
Patient app (:3002) ─┐
Nurse app   (:3003) ├──→ Express API (:4000) → PostgreSQL (:5432)
Doctor app  (:3001) ┤                         ↘ Redis (:6379) → BullMQ workers
Admin portal(:3000) ┘                          ↘ WebSocket server
```

Technology stack overview: Frontends rely on Next.js 14 with the App Router, React 18, TypeScript, Tailwind CSS, and Zustand for shared state. Axios handles API calls, Sonner provides toast notifications, and the built-in WebSocket client covers live updates. The backend runs on Node.js 20, Express 4, TypeScript, Prisma 6.16.2, PostgreSQL 16, and Redis 7. BullMQ manages job queues, the `ws` library handles sockets, Joi performs validation, Multer covers uploads, bcrypt secures passwords, Helmet and CORS supply HTTP hardening, and Winston/Morgan capture logs. Tooling includes Docker, GitHub Actions, npm, tsx for TypeScript execution, Prisma Migrate, and dotenv for configuration. Paystack underpins payments. Optional future integrations include OpenAI GPT-4 Vision for richer diagnosis support, SendGrid or SES for email, Twilio for SMS, and OneSignal or Firebase for push notifications.

Database model summary: Prisma defines core entities for users, bookings, visits, messages, payments, audit logs, notifications, and refresh tokens. Users contain encrypted address and ID fields, GPS data for nurses, push tokens, and relations to visits and messages. Bookings capture visit requests, payment status, insurance metadata, and Paystack references. Visits link bookings to assigned clinicians and store AI analysis, patient descriptions, images, triage notes, vital signs, nurse reports, doctor reviews, final diagnoses, prescriptions, and follow-up dates. Messages persist encrypted content between participants. Payments record Paystack responses and status. Audit logs store immutable SHA-256 checksums for each action. Indexing covers high-frequency queries (user email and role, booking schedule, visit status, message read status, payment reference). Prisma migrations ensure schema evolution.

Security posture: Authentication uses short-lived JWT access tokens (15 minutes) and seven-day refresh tokens stored in PostgreSQL. Tokens ship via httpOnly cookies with SameSite=Strict and the Secure flag in production. Role-based middleware enforces permissions for the four roles (patient, nurse, doctor, admin). Passwords use bcrypt with cost factor 12. Sensitive fields rely on AES-256-GCM encryption with keys sourced from environment variables. All traffic moves over HTTPS and WSS in production. Helmet, rate limiting, and a strict CORS allow list reduce attack surface. Joi validation protects each endpoint, Prisma parameterization blocks SQL injection, Multer checks file types and sizes, and audit logs guarantee tamper detection.

Application features by portal:
Admin portal capabilities: dashboards summarizing visits, revenue, and staffing; tools for user onboarding, account status management, visit oversight, payment reconciliation, messaging monitoring, and audit exports.
Doctor portal capabilities: visit queue with AI summaries, patient-uploaded images, nurse triage data, the ability to run or re-run AI analysis, secure messaging, timeline history, final diagnosis, prescription creation, and follow-up scheduling.
Nurse portal capabilities: assignment list with status filters, GPS check-ins, turn-by-turn visit status updates, triage workflows, vital sign capture, photo uploads, note taking, and messaging.
Patient portal capabilities: booking creation, historical visits, payment status, AI insights once approved by clinicians, messaging, media uploads, follow-up reminders, and profile management.

Real-time and messaging: A dedicated WebSocket gateway handles visit status changes, typing indicators, read receipts, nurse location updates, and real-time messaging across all portals. Redis pub/sub underpins socket scalability. Messages are encrypted before persistence, attachments store metadata, and queue workers send email or push notifications when recipients are offline.

AI-assisted diagnostics: The AI service ingests patient descriptions, nurse triage data, and uploaded imagery (via future OpenAI Vision integration). It generates suspected diagnoses, triage urgency, recommended tests, and treatment suggestions with confidence scoring. Clinicians review output before it becomes part of the official record. All AI results store in structured JSON so downstream analytics and compliance checks can audit usage.

Background jobs: BullMQ queues power email notifications, report generation, AI preprocessing, payment reconciliation (Paystack webhook replay), and data exports. Workers run as dedicated Node.js processes launched alongside the API. Failures write to structured logs for review.

Payment processing: Paystack handles card and insurance transactions. The backend stores references and responses, validates webhook signatures, and syncs booking or visit status when payments clear. Refund flows map to Paystack APIs and persist to the payment history.

Deployment and DevOps: Local development relies on Docker Compose for PostgreSQL and Redis. `START-DEVELOPMENT.ps1` spins up all services. CI pipelines lint, run unit tests, and execute integration suites. Production targets include Railway, Render, or Fly.io with GitHub Actions automating build and deploy. Environment variables configure secrets; rotation policies recommend using Railway or Render secret stores. Prisma migrations run automatically during deploy, and seeds populate staging data. Observability integrates Winston, structured JSON logs, optional APM hooks, and health endpoints for uptime monitors.

Testing strategy: Approximately 459 tests exist across categories. Middleware, API mocks, API integration, workers, and most flows pass. The current status shows 345 of 347 detected tests succeeding, with two integration flow cleanup issues pending. Service and webhook suites run individually but still need improved pattern detection in the consolidated report. Additional quality measures include manual smoke tests, the quick testing guide for feature walkthroughs, messaging stress scenarios, GPS update simulations, and Paystack sandbox flows.

Data retention and compliance: The platform encrypts PHI at rest, enforces audit logs, and respects POPIA and GDPR-style requirements through consent logging, access revocation, and export tooling. Admins can anonymize or delete patient records when legal retention periods expire. Backups follow daily snapshots with point-in-time recovery recommendations.

Future roadmap: near-term priorities include finishing the doctor portal authentication store, polishing nurse visit management UI, improving booking forms, enabling automated follow-up reminders, integrating email delivery, and exposing analytics dashboards. Longer term, the team can integrate wearable data ingestion, expand AI override controls, roll out push notifications, and prepare for multi-language support.

Operational playbook: For incidents, check Redis connectivity, database health, and WebSocket heartbeats. Use `run-full-platform-test.ts` to assess regression impacts. Logs live under `apps/backend/logs`. Health endpoints at `/health` and `/status/ready` support load balancers. Scaling guidelines recommend horizontal autoscaling for the API, separate worker dynos, and managed PostgreSQL with read replicas once volume grows.

Support and contacts: For assistance, email mpho@ahavahealthcare.co.za or use WhatsApp 071 472 1405. Internal documentation includes the deployment roadmap, go-live checklist, messaging testing guide, and setup manuals referenced throughout this description.

Document prepared by Mpho Thwala on behalf of Ahava on 88 Company.
