Frontend development plan

Project: Ahava Healthcare frontends. Start date: October 9, 2025. Status: in progress. Objective: deliver four user-facing Next.js applications—admin portal for system management, doctor portal for medical supervision, patient app for booking and tracking, nurse app for visit management. Priority order places the admin portal first, followed by doctor, patient, and nurse experiences. Estimated timelines: two to three weeks each for admin and doctor portals, three to four weeks for patient and nurse apps, totalling roughly ten to fourteen weeks.

Technical stack: Next.js 14 with the App Router, TypeScript, Tailwind CSS, Shadcn/ui or Material-UI for components, Zustand or React Query for state, React Hook Form plus Zod for forms, Axios with interceptors for HTTP, WebSocket client for live updates, Google Maps or Mapbox for location features, and Recharts or Chart.js for analytics. If a mobile client becomes necessary, React Native with React Navigation, Zustand, and React Native Paper covers the requirements.

Admin portal scope: manage users, visits, payments, analytics, and clinician assignments. Expected routes include dashboard, login, users (list/detail), visits (list/detail), payments (list/detail), analytics, and settings. Components include statistics cards, tables with filters, charts, and assignment modals.

Doctor portal scope: oversee assigned visits, review nurse reports, record doctor assessments, rate nurse performance, and consult patient history. Routes cover dashboard, login, visits (list/detail), patients, reports, and profile. Components include visit cards, report viewers, review forms, history views, report generation, and live messaging.

Patient app scope: create bookings, track nurses in real time, chat with clinicians, process payments, review visit history, and manage profiles. Routes include dashboard, login, registration, booking, visit list, visit detail with tracking and chat, payments, and profile. Components cover booking forms, date/time pickers, address capture, payment widgets, live maps, chat, and status trackers.

Nurse app scope: display assigned visits, update statuses, share GPS location, communicate in real time, submit reports, and navigate to patient addresses. Routes include today’s visits, login, visit list, visit detail with chat, reports, and profile. Components provide visit lists, status buttons, location sharing, navigation links, messaging, report forms, and camera integration for photos.

Design system: healthcare-inspired palette (primary #0066CC, secondary #00A86B, accent #FF6B6B, background #F8F9FA, text #212529, success #28A745, warning #FFC107, error #DC3545, info #17A2B8). Typography relies on Inter or Poppins for headings, Inter or Open Sans for body text, and Fira Code or JetBrains Mono for monospace use. Design principles emphasise accessible, responsive layouts with optional dark mode.

Shared libraries: create `packages/shared` for API clients, types, utilities, constants, and validation schemas; create `packages/ui` for reusable components (buttons, inputs, cards, modals, layouts, icons, theming).

Implementation schedule (high level): Week 1 builds the admin portal foundation (project setup, TypeScript and Tailwind configuration, routing, authentication, layouts, dashboard). Week 2 adds admin features (user management, visit management, payments, analytics, real-time updates). Week 3 focuses on doctor portal setup, authentication, visit oversight, review system, messaging. Week 4 handles patient app foundation—project setup, authentication, booking workflow, payment integration. Week 5 completes patient features (tracking, live GPS, messaging, profile). Weeks 6–7 deliver the nurse app (setup, visit management, GPS, messaging, report submission).

Security and best practices: avoid storing sensitive data in localStorage, rely on httpOnly cookies, handle CSRF, prevent XSS, sanitise inputs, enforce HTTPS, and configure environment variables per app. Implement error boundaries, loading states, offline handling if PWA features ship, and validate on both client and server.

Next action: continue with the admin portal as highest priority, completing authentication, environment setup, user management, visits, payments, and analytics. Subsequent phases replicate patterns across doctor, patient, and nurse portals, then extend into real-time features, uploads, and payments. Plan authored by Mpho Thwala on behalf of Ahava on 88 Company.
