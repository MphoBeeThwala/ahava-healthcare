Supabase database verification update

The login endpoint queries Supabase, so a successful login confirms the database connection. You can test it by running:
```
curl -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@ahava.com","password":"Test@123456789"}'
```
The call should return user data and a token if the database is healthy.

For a visual check, open https://supabase.com/dashboard/project/jschzbegevfqnbaxgoxm/editor, view the “users” table, and confirm that the seeded accounts exist (admin@ahava.com, doctor@ahava.com, nurse@ahava.com, patient@ahava.com). Backend terminal logs also help: seeing “Redis connected” and “Server running on port 4000” without database errors indicates the connection is stable.

Earlier tests showed the backend health endpoint responding, startup logs free of database errors, frontend apps communicating with the API, and SQL-based table creation succeeding. Together these observations strongly suggest Supabase is working.

For a manual end-to-end check, log into the admin portal at http://localhost:3000 using `admin@ahava.com / Test@123456789`. If the login succeeds, the database is confirmed operational. Otherwise inspect backend logs, verify the Supabase user table, and re-check the connection string in `.env`.

Current status: Supabase PostgreSQL connected, backend running, frontends running, and verification pending a quick login test.

Prepared by Mpho Thwala on behalf of Ahava on 88 Company.

