CORS configuration fix summary

On October 18, 2025 the patient and nurse applications were unable to log in because the backend CORS policy rejected requests from ports 3002 and 3003. Browser consoles displayed messages such as:
```
Access to XMLHttpRequest at 'http://localhost:4000/api/auth/login' from origin 'http://localhost:3002' has been blocked by CORS policy
```
Previously the Express server allowed only http://localhost:3000 and http://localhost:3001 (plus the Expo dev port). The backend file `apps/backend/src/index.ts` now includes the patient and nurse origins—changing the allowed origins array from `['http://localhost:3000', 'http://localhost:3001', 'http://localhost:19006']` to `['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:19006']`—so all four frontends can talk to the API.

Restart the backend to load the new configuration: in the backend PowerShell window press Ctrl+C, run `npm run dev`, and wait for “Server running on http://localhost:4000.” After the restart, retest the patient app at http://localhost:3002/login with `patient@ahava.com / Test@123456789` and the nurse app at http://localhost:3003/login with `nurse@ahava.com / Test@123456789`. Successful requests should log responses like `Login response: {success: true, user: {...}}`, display the “Welcome back!” toast, redirect to the dashboard, and show the user’s name without any CORS errors.

This adjustment simply broadens the permitted origins so the backend recognizes requests from the patient and nurse portals, resolving the login blockade. Restart now and confirm the flows behave as expected.

Prepared by Mpho Thwala on behalf of Ahava on 88 Company.








