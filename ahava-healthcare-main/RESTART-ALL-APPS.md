Restart instructions for all applications

To restart every service cleanly, begin by returning to each PowerShell window that currently runs an app, pressing Ctrl+C to stop the process, and closing the windows. Open a fresh PowerShell session for the backend and run:
```
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\backend
npm run dev
```
You should see output indicating the server is running on http://localhost:4000, the database is connected, and Redis (if available) is connected. Confirm the backend health endpoint at http://localhost:4000/health responds successfully.

Launch the admin portal by opening another PowerShell window and executing:
```
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\admin
npm run dev
```
It should be ready within a few seconds and available at http://localhost:3000/login.

Start the patient app in a third window:
```
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\patient
npm run dev
```
This instance serves http://localhost:3002/login.

Launch the nurse app in a fourth window:
```
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\nurse
npm run dev
```
It will be reachable at http://localhost:3003/login.

Optionally, start the doctor portal in a fifth window using:
```
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\doctor
npm run dev
```
The portal loads at http://localhost:3001/login.

Test credentials for each application:
```
Admin  (http://localhost:3000/login):  admin@example.com  /  password123
Patient(http://localhost:3002/login):  patient@example.com /  password123
Nurse  (http://localhost:3003/login):  nurse@example.com   /  password123
Doctor (http://localhost:3001/login):  doctor@example.com  /  password123
```
After starting the services, confirm that the backend reports the expected startup message, each portal opens on its port, the login pages load, and authentication succeeds with the above accounts.

If you encounter “port already in use” errors, locate the process with `netstat -ano | findstr :4000` (replace 4000 with the blocked port) and end it via `taskkill /PID <PID> /F`. “Module not found” issues typically disappear after running `npm install` inside the affected app directory.

Should the backend refuse to connect, double-check `.env` under `apps/backend/` for valid values such as:
```
DATABASE_URL="your-database-url"
REDIS_URL="your-redis-url"
JWT_SECRET="your-secret"
```
With all steps complete, you should have the backend on port 4000, admin portal on 3000, doctor portal on 3001 (if started), patient app on 3002, and nurse app on 3003. Log in to each interface, verify dashboards, and run through a complete workflow (patient booking to nurse update to doctor review) to ensure integration remains intact.

Guide prepared by Mpho Thwala on behalf of Ahava on 88 Company.


