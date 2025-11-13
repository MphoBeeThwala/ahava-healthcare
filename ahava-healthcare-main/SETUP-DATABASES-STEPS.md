Database and services setup steps

Supabase (PostgreSQL) setup takes about five minutes. Sign in at https://supabase.com, create a new project named `ahava-healthcare`, choose a strong password, nearest region, and the free plan. After provisioning finishes, visit Settings → Database, copy the connection string under Connection pooling, replace `[YOUR-PASSWORD]` with your actual password, and save the final string for later. Example string:
```
postgresql://postgres.abc123xyz:YourPassword123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

Upstash (Redis) setup follows the same pattern: log in at https://console.upstash.com, create a database named `ahava-redis`, choose a regional deployment in your closest region, and use the free tier. Once created, copy the Redis URL from the Redis tab (not REST) and keep it handy. Example:
```
redis://default:AbCd1234xyz@us1-great-shark-12345.upstash.io:6379
```

With both URLs ready, create the backend `.env` file. Either let me assist or do it manually: navigate to `ahava-healthcare-main\apps\backend`, copy `env.example` to `.env`, open it, and replace
```
DATABASE_URL="your-supabase-url-here"
REDIS_URL="your-upstash-url-here"
```
with the actual strings.

Next, run migrations:
```
cd ahava-healthcare-main\apps\backend
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

When the database and seeds are in place, start services:
```
cd ahava-healthcare-main
.\START-DEVELOPMENT.ps1
```
(or start each app manually in separate terminals if you prefer).

In summary: gather Supabase and Upstash URLs, create `.env`, run Prisma commands, then launch services. If you need a more detailed walkthrough, see `SETUP-DATABASES-NOW.md` or let me know the connection strings and I can help configure them.

Guide prepared by Mpho Thwala on behalf of Ahava on 88 Company.


