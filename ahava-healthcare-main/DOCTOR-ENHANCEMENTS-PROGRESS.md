Doctor portal enhancement progress

Nurse assignment functionality is now complete. Backend updates introduced a `GET /api/visits/nurses` endpoint to list active nurses, allowed doctors to call `POST /api/visits/:id/assign-nurse`, corrected the route ordering so `/nurses` no longer conflicts with the dynamic `/:id`, and exposed unassigned visits (where `doctorId` is null). On the frontend, the doctor dashboard (`apps/doctor/src/app/page.tsx`) now shows a nurse dropdown for unassigned visits, relying on the new `fetchNurses()` and `handleAssignNurse()` helpers. API integrations in `apps/doctor/src/lib/api.ts` gained `getNurses()` and `assignNurse(visitId, nurseId)`. To test, open http://localhost:3001, log in with `doctor@ahava.com / Doctor123!`, and assign nurses using the dropdown.

Next steps focus on patient image uploads and structured ailment descriptions. The goal is to capture photos of visual conditions, record detailed symptoms, store the assets securely, and surface them to both nurses and doctors. Backend tasks include adding an images field to the Visit model, creating `POST /api/visits/:id/images`, securing storage, providing retrieval endpoints, and validating file types and sizes. Frontend work covers an image upload component for the patient app, previews, display of uploads in nurse and doctor portals, and a symptom description textarea on booking forms.

Following that, the team will integrate AI-assisted pre-diagnosis. Objectives involve analyzing patient text and images, suggesting diagnoses and urgency levels, and recommending tests or actions. The backend will integrate an AI service (e.g., GPT-4 Vision), expose `POST /api/visits/:id/analyze`, store results with confidence scoring, and manage symptom analysis logic. The doctor portal must present AI output with clear urgency indicators, allow confirmation of diagnoses, and list recommended tests.

After AI integration, development shifts to triage and final diagnosis workflows. Nurses will capture vital signs and assessments, doctors will review and finalize diagnoses, and the system will track workflow status. Backend changes will add triage fields to the Visit model, endpoints such as `POST /api/visits/:id/triage` and `POST /api/visits/:id/diagnosis`, and status tracking. Frontend changes include triage forms in the nurse portal, doctor diagnosis forms, vital sign inputs, and displays of triage data.

Current status snapshot:
- Nurse assignment: complete (100%).
- Image upload: next (0%).
- Ailment description: next (0%).
- AI pre-diagnosis: pending (0%).
- Triage workflow: pending (0%).
- Final diagnosis: pending (0%).

Active services:
- Backend API at http://localhost:4000
- Doctor portal at http://localhost:3001
- Admin portal at http://localhost:3000
- Patient portal at http://localhost:3002
- Nurse portal at http://localhost:3003

Last updated on October 19, 2025, when work resumed after a network interruption.

Summary authored by Mpho Thwala on behalf of Ahava on 88 Company.






