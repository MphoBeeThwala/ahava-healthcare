Quick testing guide for new features

Start by ensuring all services are running. In the backend directory, launch the API with Redis enabled:
```
cd C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main\apps\backend
$env:SKIP_REDIS="false"
npm run dev
```
Open additional terminals for the doctor, patient, and nurse apps:
```
cd ...\apps\doctor
npm run dev

cd ...\apps\patient
npm run dev

cd ...\apps\nurse
npm run dev
```

Test scenario: verify the end-to-end workflow. First, log into http://localhost:3001 as `doctor@ahava.com / Doctor123!`. Confirm visits appear; assign a nurse via the dropdown for any unassigned visit, and watch for a success toast.

Next, log into http://localhost:3002 with `patient@ahava.com / Patient123!`. Open a scheduled visit, enter an ailment description (e.g., “I have a red rash…”) and save it—expect the “Description saved!” toast. Upload one to three images in the “Upload Images” section, confirm the success toast, and ensure the images display.

Back in the doctor portal, open the same visit. The three-column view should show patient info, images, and the new description. Click “Run AI Analysis”; the system should display urgency, differential diagnoses, tests, recommendations, and confidence scores.

For triage, log into http://localhost:3003 with `nurse@ahava.com / Nurse123!`, open the visit, update the status to “ARRIVED,” and manually navigate to `/visits/[VISIT_ID]/triage`. Populate vital signs (temperature 37.2, blood pressure 120/80, heart rate 72, saturation 98), choose “ROUTINE,” write an assessment, and submit. Confirm the toast appears, signaling completion.

Return to the doctor portal. The visit now includes nurse triage data in the middle column. On the right, fill in the final diagnosis and prescriptions, mark follow-up required, pick a date seven days out, and submit. You should see a diagnosis success toast and a green completion panel.

Finally, revisit the patient portal, open the same visit, and verify the description, images, triage data, diagnosis, prescriptions, and follow-up details display.

Use the testing checklist to confirm: nurse assignment works, patients can record descriptions and upload multiple images, AI analysis renders with color-coded urgency, nurses see the data, triage forms submit correctly, doctors see complete information and finalize diagnoses, and patients read the final record.

Troubleshooting tips: if the backend fails to respond, check `http://localhost:4000/health` and restart the server. If a frontend fails to compile, remove the `.next` directory and rerun `npm run dev`. Database issues usually involve Docker containers; verify with `docker ps` or restart Postgres via `docker-compose restart postgres`. Missing fields typically mean migrations haven’t run—execute `npx prisma migrate deploy`.

In the doctor portal, expect a responsive three-column layout with patient data on the left, AI analysis and triage in the middle, and the diagnosis form on the right. AI (mock) urgencies map to colored badges: green (routine), orange (urgent), red (emergency).

Additional checks include verifying real-time components (typing indicators, message delivery), queuing behavior when the connection drops, and ensuring location tracking updates recently submitted visits.

Wrap-up: once all steps pass, note the visit ID, capture console or network logs for any anomalies, and record environment details (OS, browser, environment). Provide reproduction steps with expected vs actual behavior. This quick run should confirm the new features work from patient booking through doctor feedback.

Guide documented by Mpho Thwala on behalf of Ahava on 88 Company.






