Environment variable setup guide

Configuring the four Next.js applications takes about two minutes each. For every portal (admin, patient, nurse, doctor), navigate into the app directory, create `.env.local`, paste the appropriate template, and save. The admin portal expects:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_APP_NAME=Ahava Healthcare Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
```
The patient app adds a Paystack key:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_NAME=Ahava Healthcare
NEXT_PUBLIC_APP_VERSION=1.0.0
```
Nurse and doctor portals mirror the admin config, adjusting `NEXT_PUBLIC_APP_NAME` accordingly. PowerShell users can generate each file with a short here-string, for example:
```
cd apps/admin
@"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_APP_NAME=Ahava Healthcare Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
"@ | Out-File -FilePath .env.local -Encoding utf8
cd ../..
```
A combined script walks through all four directories sequentially and prints “All environment files created!” when complete. Afterward, confirm presence with `Test-Path apps/admin/.env.local` (repeat for patient, nurse, doctor); each command should return `True`.

The `NEXT_PUBLIC_` prefix exposes values to the browser, which is required for Next.js. Leave the backend URL at `http://localhost:4000` during local development and switch to the production domain later; the WebSocket URL defaults to `ws://localhost:4000` and should become `wss://…` in production. Obtain the Paystack test key from the developer dashboard and swap in the live key once ready for production traffic. `.env.local` files live in `.gitignore`; never commit them or share Paystack credentials publicly, and maintain different keys for test and production environments.

If variables appear missing, restart the dev server (`npm run dev`), ensure the file name is exactly `.env.local` (not `.txt`-suffixed), and verify every browser-exposed variable begins with `NEXT_PUBLIC_`. Use `Get-Content apps/admin/.env.local` to inspect the file if necessary. Once the files exist, you can proceed with starting each portal. Guide prepared by Mpho Thwala on behalf of Ahava on 88 Company.
