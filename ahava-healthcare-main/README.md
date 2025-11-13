Ahava Healthcare overview

Ahava Healthcare is a comprehensive platform built for South Africa that connects patients with qualified nurses for home visits and keeps doctors in the loop for oversight. The system also supports administrators through analytics, payment reconciliation, and real time monitoring.

Project summary

The platform makes it easy for patients to book visits, nurses to manage day-to-day operations, doctors to supervise care, and the business team to keep things running. Real time features cover messaging, GPS tracking for nurses, visit status updates, and Paystack powered payments.

Getting started

Prerequisites: Node.js 20 or newer, Yarn 4 or newer, a PostgreSQL database, and a Redis instance.

Installation steps:
```
# Clone the repository
git clone https://github.com/MphoBeeThwala/ahava-healthcare.git
cd ahava-healthcare

# Install dependencies
corepack yarn install

# Environment variables are already configured for development
# apps/backend/.env ships with sensible defaults

# Generate Prisma client and run migrations
corepack yarn prisma:generate
corepack yarn prisma:migrate

# Start development servers
corepack yarn dev
```
For more detailed setup instructions, including database preparation, refer to docs/DEVELOPMENT.md.

Available scripts
```
# Development
corepack yarn dev                 # Start all services
corepack yarn dev:api            # Backend API only
corepack yarn dev:admin          # Admin portal only
corepack yarn dev:doctor         # Doctor portal only
corepack yarn dev:patient        # Patient app only
corepack yarn dev:nurse          # Nurse app only
corepack yarn dev:worker         # Background worker only

# Testing
corepack yarn test               # Run all tests
corepack yarn test:backend       # API tests only
corepack yarn test:web           # Frontend tests only

# Database
corepack yarn prisma:generate    # Generate Prisma client
corepack yarn prisma:migrate     # Run migrations
corepack yarn prisma:seed        # Seed database
corepack yarn db:reset           # Reset database

# Code quality
corepack yarn lint               # Check code style
corepack yarn lint:fix           # Fix code style issues
corepack yarn type-check         # TypeScript type checking
corepack yarn build              # Build all packages
```

Monorepo structure
```
ahava-healthcare/
├── apps/
│   ├── backend/        # Express.js API server
│   ├── admin/          # Next.js admin portal
│   ├── doctor/         # Next.js doctor portal
│   ├── patient/        # Patient mobile/web app
│   ├── nurse/          # Nurse mobile app
│   └── worker/         # Background job processor
├── packages/
│   ├── shared/         # Shared utilities and types
│   └── ui/             # Reusable UI components
├── deploy/             # Deployment configurations
└── docs/               # Documentation
```

Core features

Authentication and security: JWT based authentication with refresh tokens, role based access control (patient, nurse, doctor, admin), encryption for sensitive data, and attention to HIPAA style requirements.

User management: multi role accounts with profile management, phone and email verification, nurse location tracking, and push notifications.

Healthcare operations: bookings, visit tracking, in-app messaging, and medical report storage.

Payments: Paystack integration, insurance support, status tracking, and refund management.

Real time functionality: WebSockets for live updates, GPS for nurses, messaging, and dynamic visit status.

Technology stack

Backend: Node.js with TypeScript, Express.js, PostgreSQL with Prisma, Redis, BullMQ, JWT with bcrypt, Sharp, PDFKit, and WebSocket support.

Frontend: Next.js with TypeScript, CSS Modules, Tailwind CSS, React Query, Zustand, and Google Maps integration.

Infrastructure: deployable to Railway (primary), Render, or Fly.io with GitHub Actions for CI/CD, Railway dashboards for monitoring, and local volume storage.

Deployment options

Railway is the primary target for one click deploys with managed databases. Render and Fly.io are configured as alternatives. See deploy/README.md for platform specific instructions.

Configuration and environment variables

Key values include:
```
# Database
DATABASE_URL=postgresql://...

# Cache
REDIS_URL=redis://...

# Authentication
JWT_SECRET=your-32-character-secret
ENCRYPTION_KEY=base64-encoded-32-byte-key

# Payments
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=your-webhook-secret

# Timezone
TIMEZONE=Africa/Johannesburg
```

Database schema

Primary entities include users, bookings, visits, messages, payments, and reports. Review apps/backend/prisma/schema.prisma for the complete model definitions.

Contributing guide

1. Fork the repository.
2. Create a feature branch: git checkout -b feature/your-change.
3. Commit with a clear message.
4. Push to your fork.
5. Open a pull request for review.

License

The project is released under the MIT License. See the LICENSE file for details.

Support

Email: support@ahavahealthcare.co.za
Documentation site: https://docs.ahavahealthcare.co.za
Issue tracker: https://github.com/MphoBeeThwala/ahava-healthcare/issues

Localization

The platform is tailored for South Africa: timezone Africa/Johannesburg (SAST), English language support (with room for local languages), South African Rand as the currency, and alignment with local healthcare regulations.

Documented by Mpho Thwala on behalf of Ahava on 88 Company.
