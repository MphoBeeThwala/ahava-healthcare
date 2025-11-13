Real-time messaging testing guide

Date: January 2025 — the real-time messaging feature is ready for validation. The system allows patients, nurses, doctors, and admins to communicate during visits with AES-256-GCM encryption, WebSocket delivery, secure storage, and typing indicators.

Prerequisites before testing: run the backend API at http://localhost:4000, start all four frontends (admin on 3000, doctor on 3001, patient on 3002, nurse on 3003), ensure the database is seeded with test users, and confirm at least one visit exists with assigned nurse/doctor. Test credentials include admin@example.com, doctor@example.com, nurse@example.com, and patient@example.com, each using `Test1234!@#$`.

Testing scenarios:

Scenario 1 centers on patient-to-nurse messaging. Log into http://localhost:3002/login as the patient, open a visit detail view, and monitor the browser’s WebSocket panel. Send a message and confirm it appears instantly with the correct sender name. In the nurse app (http://localhost:3003/login), open the same visit’s triage view to verify immediate receipt. Reply from the nurse side and confirm the patient chat updates instantly with accurate ordering. While the patient types, the nurse should see a “…” indicator that clears within three seconds. Check connection status by observing the green connected badge, toggling network offline to see it switch to red, then returning online to verify auto-reconnect.

Scenario 2 covers doctor-to-patient exchanges. Sign into http://localhost:3001/login, open the visit detail page, send a message, and verify the patient receives it. Reply from the patient, ensuring the doctor’s chat updates in real time and content remains readable after encryption/decryption.

Scenario 3 ensures multi-party messaging works. Log in as patient, nurse, and doctor simultaneously, send messages from each, and confirm that all participants receive every entry exactly once with the correct sender identification and persistent history.

Scenario 4 focuses on connection resilience. Start a conversation, close and reopen tabs to confirm automatic reconnection and history loading. Simulate network loss mid-message to ensure queuing and eventual delivery when the connection restores. Open two browsers as the patient to confirm messages stay in sync across devices.

Verification checklist: visually confirm that chat windows render correctly, messages stay in chronological order (newest last), auto-scroll works, typing indicators animate, connection status matches actual WebSocket state, timestamps and sender labels are correct. Functionally, verify immediate send/receive without refresh, initial history loading, typing signals, auto-reconnect, offline queuing, Enter-to-send, and that long messages wrap properly. Security checks include inspecting database records for encrypted payloads, ensuring only authorized users can send/receive, WebSocket authentication works, and tokens expire gracefully. Performance checks involve observing sub-100 ms delivery times, watching memory usage in DevTools, confirming smooth scrolling with many entries, and ensuring idle connections remain stable.

Troubleshooting tips: if the WebSocket shows “Disconnected,” confirm the backend health route and `/api/auth/ws-token` respond, cookies are set, and there are no console errors. If messages fail to appear, check connection status, ensure visit IDs match, inspect the console, and test `POST /api/messages`. For missing typing indicators, verify the WebSocket is active, confirm the typing event is firing, and watch for console warnings. If auto-scroll breaks, inspect the ChatWindow code path. Message queuing problems usually relate to offline detection; bring the browser offline, queue a message, reconnect, and ensure logs show the flush. Typing indicator overlaps or route-mismatch warnings point to multiple WebSocket instances; limit each tab to a single connection. Encryption failures (“Unable to decrypt message”) mean the AES key or IV is missing—clean cookies, log in again, and retest.

Final sweep: after validating messaging, document the visit ID, attach console/network logs when encountering issues, and note the environment state (dev versus production). Provide reproduction steps along with expected versus actual outcomes. Once the checklist passes, mark the messaging feature as verified.

Guide documented by Mpho Thwala on behalf of Ahava on 88 Company.

