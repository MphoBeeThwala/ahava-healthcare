Application startup quick reference

Start the backend first: open a PowerShell window and run
```
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\backend
npm run dev
```
Leave the window running once you see confirmation that the server listens on http://localhost:4000.

For the admin portal, open a second PowerShell window and execute
```
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\admin
npm run dev
```
When the output shows the server listening on port 3000, keep the window open. Visit http://localhost:3000/login and sign in with `admin@ahava.com` / `Test@123456789` to confirm everything works.

Other portals can start the same way when needed:
- Patient: `cd ...\apps\patient` then `npm run dev` (http://localhost:3002)
- Nurse: `cd ...\apps\nurse` then `npm run dev` (http://localhost:3003)
- Doctor: `cd ...\apps\doctor` then `npm run dev` (http://localhost:3001)

Stop any app with Ctrl+C in its PowerShell window. A quick success check involves verifying the backend on port 4000, the admin portal on port 3000, and confirming that login succeeds and shows the dashboard.

Guide documented on October 15, 2024. Prepared by Mpho Thwala on behalf of Ahava on 88 Company.


