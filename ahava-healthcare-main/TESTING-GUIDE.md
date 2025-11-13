Testing guide overview

Current status: the backend API should already be running on http://localhost:4000 with a health check at http://localhost:4000/health. PowerShell windows likely still host the four frontend apps (admin at port 3000, doctor at 3001, patient at 3002, nurse at 3003). Next.js often takes thirty to sixty seconds to compile on the first run, so watch each window for “Ready” messages, or red errors that might need attention.

Manual tests begin by confirming the backend. Open http://localhost:4000/health in a browser; expect `{"status":"ok"}`. If the backend is down, restart it:
```
cd apps\backend
npm run dev
```
Once the frontend windows report they are ready, visit each portal:
- Admin: http://localhost:3000 → login with `admin@ahava.com` / `Test@123456789`
- Doctor: http://localhost:3001 → login with `doctor@ahava.com` / `Test@123456789`
- Patient: http://localhost:3002 → login with `patient@ahava.com` / `Test@123456789`
- Nurse: http://localhost:3003 → login with `nurse@ahava.com` / `Test@123456789`

If a frontend fails to launch, inspect the corresponding PowerShell window. Reinstall dependencies if needed:
```
cd apps\admin
npm install
```
Start the app manually:
```
cd apps\admin
npm run dev
```
For backend port conflicts, run `Get-NetTCPConnection -LocalPort 4000` to see what occupies the port.

Quick success checklist:
- Backend responds at http://localhost:4000/health
- Admin portal loads on port 3000
- Doctor portal loads on port 3001
- Patient app loads on port 3002
- Nurse app loads on port 3003
- Each portal accepts the test credentials above
- Navigation works without console errors

Next steps once everything loads: log into each portal, create a patient booking, review visits as other roles, and exercise navigation end to end. Keep note of whether the PowerShell windows report readiness, any error messages, and whether the browser can reach the listed URLs.

Guide prepared by Mpho Thwala on behalf of Ahava on 88 Company.

