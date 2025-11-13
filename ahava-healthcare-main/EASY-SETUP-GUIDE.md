Simple database setup using Supabase SQL editor

To avoid connection string troubleshooting, copy the SQL schema directly into Supabase. Open https://supabase.com/dashboard/project/jschzbegevfqnbaxgoxm/sql/new and load the SQL editor. In the project root, open `SETUP-DATABASE-SQL.sql`, select all content, copy it, and paste into the editor. Click “Run” (or press Ctrl+Enter) and wait for the success confirmation.

Verify the tables under Supabase’s Table Editor; you should see `users`, `bookings`, `visits`, `messages`, `payments`, and more. Inspect the `users` table—four seeded accounts (admin@ahava.com, doctor@ahava.com, nurse@ahava.com, patient@ahava.com) should appear, each with the password `Test@123456789`.

After running the script, let me know and I can update the `.env` file, regenerate the Prisma client, launch services, and run tests. You can also continue manually:
```
cd apps\backend
yarn dlx prisma generate
cd ..\..
.\START-DEVELOPMENT.ps1
```
This workflow works because the Supabase SQL editor connects straight to your database, bypassing local network or firewall issues.

Guide written by Mpho Thwala on behalf of Ahava on 88 Company.


