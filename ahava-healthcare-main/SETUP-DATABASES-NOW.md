Quick database setup guide

This walkthrough takes about fifteen to twenty minutes and uses free tier services. Prerequisites: Node.js v20 or later, a GitHub account for cloud sign-ups, and a text editor for the `.env` file.

Step 1: Supabase (PostgreSQL) setup takes roughly five minutes. Visit https://supabase.com, sign in with GitHub or Google, and create a new project named `ahava-healthcare`. Set a strong database password (at least eight characters, e.g., `Ahava2024!Secure#Pass`) and save it. Choose the closest region (for South Africa, consider `eu-west-1` or `eu-central-1`) and select the free plan. Wait two to three minutes for provisioning. Once ready, go to Settings → Database, open the Connection string section, select the URI tab, and copy the connection string. Replace `[YOUR-PASSWORD]` with your actual password. Example final string:
```
postgresql://postgres.abcdefghijklmnop:Ahava2024!Secure#Pass@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

Step 2: Upstash (Redis) setup also takes about five minutes. Go to https://console.upstash.com, sign in with GitHub or Google, and create a database named `ahava-redis`. Choose Regional (not Global), select the same region as Supabase if possible, and use the pay-as-you-go free tier. After creation, find the Redis URL (use the Redis tab, not REST) and save it. Example:
```
redis://default:AbCdEf123456@us1-great-shark-12345.upstash.io:6379
```

Step 3: Create the backend `.env` file. Navigate to the backend folder:
```
cd "C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\backend"
```
Copy `env.example` to `.env`:
```
Copy-Item env.example .env
```
Or create `.env` manually. Open it and update these lines:
```
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
REDIS_URL="redis://default:YOUR_TOKEN@us1-great-shark-12345.upstash.io:6379"
```
Keep the other values as shown (JWT secrets, encryption keys, server config, etc.). Optional sections like Paystack, email, and AI services can be configured later. Save the file.

Step 4: Run database migrations. Generate the Prisma client:
```
cd "C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\backend"
npx prisma generate
```
Expected output: "✔ Generated Prisma Client". Then deploy migrations:
```
npx prisma migrate deploy
```
Expected output shows applied migrations like `20250929172822_init`, `20251019113148_add_enhanced_visit_fields`, etc. Finally, seed the database to create test users:
```
npm run prisma:seed
```
Expected output confirms creation of admin@ahava.com, doctor@ahava.com, nurse@ahava.com, and patient@ahava.com. Your database is now set up with test users.

Step 5: Start all services. Option A (easiest): from the project root, run:
```
cd "C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main"
.\START-DEVELOPMENT.ps1
```
This opens six PowerShell windows for the backend API (port 4000), background workers, admin portal (3000), doctor portal (3001), patient app (3002), and nurse app (3003). Option B (manual): open six terminals and run `npm run dev` in each app directory (`apps/backend`, `apps/admin`, `apps/doctor`, `apps/patient`, `apps/nurse`), plus `npm run dev:worker` for workers.

Step 6: Verify everything works. Test the backend API by visiting http://localhost:4000/health; you should see `{"status":"ok","timestamp":"2025-01-..."}`. Test the frontends at http://localhost:3000 (admin), http://localhost:3001 (doctor), http://localhost:3002 (patient), and http://localhost:3003 (nurse). Test login with these accounts (password `Test@123456789` for all): admin@ahava.com, doctor@ahava.com, nurse@ahava.com, patient@ahava.com.

Step 7: Test core workflows. Patient booking flow: log into the patient app, navigate to Book Visit or Dashboard, create a booking with date/time, address, and payment method, then verify it appears in the visits list. Admin management: log into the admin portal, view the Users page (should show four test users), check the Visits page for any bookings, and review the Payments page. Nurse visit management: log into the nurse app, view the dashboard for assigned visits, open a visit to see details, and update the status (e.g., EN_ROUTE to ARRIVED). Doctor review: log into the doctor portal, view the dashboard for assigned visits, open a visit to review, and review the nurse report and submit a rating.

Troubleshooting: if you see "Cannot connect to database", verify the DATABASE_URL in `.env`, ensure the password matches your Supabase password, check that the Supabase project is active, and test the connection with `npx prisma db pull`. For "Cannot connect to Redis", verify the REDIS_URL in `.env`, confirm the Upstash database is active, and ensure you copied the full Redis URL (not the REST URL). For "Port already in use", find and stop the process:
```
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process
```
Or kill all Node processes (use with caution):
```
Get-Process node | Stop-Process
```
If Prisma migration fails, you can reset the database (warning: deletes all data):
```
npx prisma migrate reset
npx prisma migrate deploy
npm run prisma:seed
```
If a frontend won't start, ensure dependencies are installed:
```
cd apps\[app-name]
npm install
npm run dev
```

Quick reference: database URL formats are PostgreSQL `postgresql://postgres.[project]:[password]@[host]:6543/postgres` and Redis `redis://default:[token]@[host]:6379`. Test credentials use password `Test@123456789` for admin@ahava.com, doctor@ahava.com, nurse@ahava.com, and patient@ahava.com. Service ports: backend API 4000, admin portal 3000, doctor portal 3001, patient app 3002, nurse app 3003.

Success checklist: verify Supabase project is active, Upstash database is active, `.env` file has correct URLs, Prisma migrations ran successfully, database is seeded with test users, backend API responds to `/health`, all frontend apps start without errors, and you can log into each portal/app with test credentials.

You're all set. The platform is running with cloud databases. You can test all features, create bookings, manage visits, process payments in test mode, test messaging, and review workflows. Next steps include completing remaining frontend features (real-time messaging UI, GPS maps), setting up a Paystack account for real payments, configuring email for notifications, adding automated tests, and deploying to staging/production. For additional help, see `GET-STARTED.md`, `TROUBLESHOOTING.md`, or `PROJECT-STATUS.md`.

Guide prepared by Mpho Thwala on behalf of Ahava on 88 Company.
