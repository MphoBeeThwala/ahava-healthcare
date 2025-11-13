Doctor portal enhancement plan

Current challenge: doctors cannot assign visits to nurses downstream in the workflow. Desired outcome: support AI-assisted pre-diagnosis with patient images and descriptions so clinicians can review richer context before arriving.

User requirements revolve around four missing pieces: assign visits directly to nurses, capture ailment descriptions alongside image uploads, feed those inputs into an AI pre-diagnosis service, and provide a triage system that helps doctors deliver a final decision. Patients trigger the analysis by submitting structured information, nurses handle on-site triage, and doctors review AI-supported insights.

Recommended roadmap:
Phase 1 (about 30 minutes) focuses on doctor-to-nurse assignment. Add an “Assign to Nurse” action on each visit card, expose a dropdown list of available nurses, set the visit status to “ASSIGNED,” and notify the chosen nurse.
Phase 2 (about 45 minutes) equips the patient experience with image upload support. Introduce a component that handles multiple formats (JPG, PNG, WebP), compresses images client-side as needed, and sends them securely to the backend for storage.
Phase 3 (about 30 minutes) enhances the ailment description form to capture structured symptoms, severity levels, and duration, giving the AI and doctors richer inputs to evaluate.
Phase 4 (about 60 minutes) integrates AI pre-diagnosis. Connect to the chosen model (OpenAI or Claude), analyze both text and images, and return preliminary differential diagnoses plus recommended tests.
Phase 5 (about 45 minutes) completes the doctor review flow. Display AI suggestions within the portal, allow doctors to approve, reject, or amend each recommendation, confirm the final diagnosis, and record triage priority.

Technical considerations: the backend needs endpoints for assignments, secure image handling, AI service integration, and a richer visit schema. The frontends must surface nurse assignment UI, patient upload screens, AI result views, and triage interactions. Schema updates include fields for image URLs, AI diagnosis data, patient-described ailments, and the assigned nurse ID.

Expected results once the plan is in place: doctors assign visits to nurses, patients attach visual evidence, AI delivers preliminary guidance, and doctors finalize triage decisions. Success metrics include confirming that doctors can pick specific nurses, patients can upload multiple images per visit, AI outputs relevant suggestions, physicians can confirm or modify those recommendations, and the triage workflow operates end to end.

Authored by Mpho Thwala on behalf of Ahava on 88 Company.






