Manual testing walkthrough for new features

You can exercise the enhanced workflow in roughly fifteen minutes by booking a visit through the patient app, supplying descriptions and images, assigning a nurse, running AI analysis, triaging, and submitting the final diagnosis.

Begin with visit creation. Open http://localhost:3002, authenticate with `patient@ahava.com / Patient123!`, click “Book a Visit,” and complete the form (tomorrow at 2 PM, address `123 Test Street, Cape Town`, duration `1 hour`, payment method `Credit/Debit Card`). When redirected to Paystack, simply close the tab and return to the patient portal. Navigate to `/visits`, open the newly created visit, and proceed.

Add ailment details and images. In the visit page’s blue “Describe Your Ailment” section, enter a detailed description (sample text: “I have been experiencing a persistent rash on my left forearm…”). Save it and confirm the toast notification appears. In the purple upload section, select one to three image files, upload them, and verify they display immediately.

Assign a nurse. In a new tab, visit http://localhost:3001, log in with `doctor@ahava.com / Doctor123!`, locate the new visit, choose a nurse (e.g., Jane Nurse) from the dropdown, and confirm the toast acknowledges success.

Run AI analysis. From the doctor portal, open the visit details. The three-column layout should show patient information, images, and an empty AI section. Click “Run AI Analysis,” wait for the confirmation toast, and check that the AI output fills in with urgency, suggested diagnoses, recommended tests, and confidence scores.

Perform triage on the nurse side. Visit http://localhost:3003, sign in with `nurse@ahava.com / Nurse123!`, open the assigned visit, and navigate to `/visits/[VISIT_ID]/triage` using the actual ID shown in the URL. Enter vitals (37.2°C, 120/80, 72 bpm, 98% SpO₂), set urgency to Routine, add the initial assessment, submit, and ensure the success toast fires before you are redirected to the nurse dashboard.

Finalize the diagnosis. Back in the doctor portal, reopen the visit and confirm all sections now display patient imagery, ailment text, AI output, and triage data. Fill in the final diagnosis, list prescriptions (one per line), flag follow-up requirements (e.g., seven days ahead), and submit. A toast should appear, and the right column should show the diagnosis in a green summary box.

Conclude by returning to the patient portal. Refresh the visit page and verify that your description, images, triage results, doctor’s diagnosis, prescriptions, and follow-up date all render—this confirms the full data flow from patient to nurse to doctor and back.

Key checks: the doctor dashboard uses a responsive three-column layout with colored urgency badges (green for routine, orange for urgent, red for emergency). The patient view now exposes triage and diagnosis with appropriate coloring.

Additional optional tests include verifying: deletion of images, editing the description, exploring doctor AI override paths, confirming messaging flows, and checking audit log entries.

Testing guide written by Mpho Thwala on behalf of Ahava on 88 Company.

