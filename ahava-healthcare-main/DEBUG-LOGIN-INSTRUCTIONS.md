Patient and nurse login debugging guide

Console logging is now in place for the patient and nurse apps. Before attempting a login, open the browser’s developer tools (press F12) and switch to the Console tab. Visit http://localhost:3002/login, sign in with `patient@ahava.com / Test@123456789`, and watch the console. A message such as `Login response: {success: true, user: {...}}` indicates success; messages like `Login error: ...` or red stack traces suggest a problem worth noting. Repeat the same process at http://localhost:3003/login using `nurse@ahava.com / Test@123456789`. Successful nurse logins should echo something like `Login response: {success: true, user: {role: 'NURSE', ...}}`, while role mismatches or API failures produce specific console output. Capture screenshots or copy the console log whenever you see errors.

Common issues and remedies:
- “Network Error” usually means the backend is down or the API URL is incorrect. Check with `netstat -ano | findstr :4000`; restart if needed:
```
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\backend
npm run dev
```
- “401 Unauthorized” or “Invalid credentials” signals incorrect login data or missing seed users. Verify the email/password pair and reseed with:
```
cd apps\backend
npx tsx src/seed.ts
```
- CORS errors imply the frontend `.env.local` needs `NEXT_PUBLIC_API_URL=http://localhost:4000`.
- “Unexpected token” or JSON parsing errors show the backend returned HTML; check http://localhost:4000/health for JSON output—if not, the backend has issues to resolve.
- Successful login without redirect suggests the dashboard has frontend errors; inspect the console after the login response.
- “Content unavailable. Resource was not cached” typically means a stale Next.js build; stop the app, delete `.next`, and restart:
```
cd apps\patient
Remove-Item -Recurse -Force .next
npm run dev
cd ..\nurse
Remove-Item -Recurse -Force .next
npm run dev
```

When reporting results, include for the patient app whether the login succeeded, the relevant console output, any displayed error message, and a short description of what happened. Do the same for the nurse app. To confirm the backend works independently, run a direct request:
```
$body = @{
    email = "patient@ahava.com"
    password = "Test@123456789"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```
The expected response looks like `{"success":true,"user":{...},"accessToken":"..."}`. If that request succeeds, backend authentication logic is functioning and any remaining issues reside in the frontend.

In summary: open the browser console, test the patient and nurse logins, note the console messages, and share what you see so we can pinpoint the next steps.

Guide documented by Mpho Thwala on behalf of Ahava on 88 Company.




