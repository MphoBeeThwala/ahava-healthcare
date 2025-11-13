Testing plan option A: verify current apps

Goal: spend one to two hours confirming what works today and noting gaps. Date reference: October 18, 2025.

Phase 1 (start all services): confirm the backend listens on port 4000, the admin portal on 3000, the patient app on 3002, and the nurse app on 3003.

Phase 2 (authentication):
- Admin portal at http://localhost:3000 should show the login page, accept `admin@ahava.com / Test@123456789`, redirect to the dashboard, avoid console errors, and set the cookie (check DevTools → Application → Cookies).
- Patient app at http://localhost:3002 should do the same for `patient@ahava.com / Test@123456789`.
- Nurse app at http://localhost:3003 should do the same for `nurse@ahava.com / Test@123456789`.

Phase 3 (admin portal features): the dashboard should display total counts for users (expect four), visits, payments, and any recent activity without API errors. The user management page (`/users` or `/admin/users`) should list the four seeded users (admin, doctor, nurse, patient), allow drilling into details, and support search/filtering if implemented. The visit management page (`/visits`) should show visits (even if empty), allow viewing details, and optionally creating new ones. The payment page (`/payments`) should list payments, statuses, and amounts. Capture any admin portal issues here:
```
[Document any errors, missing pages, or broken features]
```

Phase 4 (patient app features): the dashboard should welcome the patient, show upcoming and past visits, and provide working navigation. Check for pages such as `/bookings` (or `/book-visit`), `/visits` (or `/my-visits`), `/profile`, and `/messages`. If a booking UI exists, ensure the form includes service type, date/time, notes, submits successfully, and surfaces in both patient and admin views. If the UI does not exist, note it as work to build. Record patient app issues:
```
[Document any errors, missing pages, or broken features]
```

Phase 5 (nurse app features): the dashboard should greet the nurse, list assigned and completed visits, and provide working navigation. Verify the existence of `/visits`, `/visits/:id`, `/profile`, and `/messages`. If the visit update flow exists, confirm details display correctly, status and notes updates save, location updates persist, and changes appear in the admin portal. Note missing UI if absent. Record nurse app issues:
```
[Document any errors, missing pages, or broken features]
```

Phase 6 (API connectivity): open http://localhost:4000/api/health and expect a JSON response such as `{ "status": "ok", "timestamp": "...", "timezone": "Africa/Johannesburg" }`. Optional direct API checks:
```
GET http://localhost:4000/api/admin/users (requires auth cookie, should return four users)
GET http://localhost:4000/api/auth/me (returns current user data)
GET http://localhost:4000/api/bookings/patient/<patient-id> (returns bookings, possibly empty)
```

Phase 7 (cross-app integration): run through a full workflow. As admin, log in, confirm the four users, and review data. As patient, log in and attempt to book a visit if the UI exists, noting that this creates test data. Return to the admin portal, refresh, and confirm the booking appears, then assign a nurse if possible. As nurse, log in, check for the assigned visit, and attempt to update its status. Document integration issues:
```
[Document any cross-app issues or data sync problems]
```

Results summary template for after testing:
```
What works:
- Backend API on port 4000
- Authentication with httpOnly cookies
- Admin login
- Patient login
- Nurse login
- [Add more]

What is partially working:
- Admin dashboard shows data but...
- Patient app has dashboard but missing booking form
- [Add more]

What is missing:
- Patient booking form UI
- Nurse visit update UI
- Doctor portal auth store
- [Add more]

Errors encountered:
[List any errors with details]
```

Next steps guidance: if everything passes, proceed with building missing UI pages, test complete workflows, polish the experience, and move toward staging deployment. If some items fail, prioritize authentication, API connections, and routing fixes before UI work. If major issues appear, document them thoroughly, fix backend connections, and retest prior to building new features.

Test credentials summary:
- Admin: `admin@ahava.com / Test@123456789`
- Doctor: `doctor@ahava.com / Test@123456789`
- Nurse: `nurse@ahava.com / Test@123456789`
- Patient: `patient@ahava.com / Test@123456789`

When reporting results after each phase, provide what worked, what failed, observations, and screenshots where useful.

Plan authored by Mpho Thwala on behalf of Ahava on 88 Company.




