Real-time features progress update

As of January 2025 the messaging stack is finished and live, while GPS maps and real-time status indicators remain underway. The backend WebSocket server handles authentication, message encryption, and issues tokens through `/api/auth/ws-token`. Each frontend now exposes a `useWebSocket` hook (`apps/*/src/hooks/useWebSocket.ts`) and a `ChatWindow.tsx` component wired into visit detail screens: patient (visit detail), nurse (triage workflow), doctor (visit detail), and the admin portal (ready once its visit detail page is built). Messaging covers real-time delivery, typing indicators, automatic scrolling, connection-state feedback, message history loading, auto-reconnect, and offline queuing.

Next, the team will build GPS map visualizations and live status updates. GPS work requires a mapping library (`@react-google-maps/api` or Leaflet), a `VisitMap` component in the patient app, a `LocationTracker` component in the nurse app, and integration with backend location updates to display routes, location history, and ETAs. Real-time status updates rely on WebSocket events (`VISIT_STATUS_CHANGED`, `LOCATION_UPDATE`) already emitted by the backend; the frontend still needs a hook to subscribe, auto-refresh visit lists, and surface toast or badge indicators.

Outstanding tasks:
- GPS maps (high priority): install the map library, implement patient and nurse components, wire location updates, compute ETAs, and render routes.
- Real-time status (medium priority): build `useVisitStatus`, listen for change events, refresh lists, and surface toasts and badges.
- Admin visit detail (low priority): add the view in the admin portal and include the chat window.

Progress snapshot: messaging is at 100%, GPS mapping and real-time status remain at zero, and the admin chat integration sits around thirty percent. Overall, real-time feature work is roughly forty percent complete. The next session should focus on map visualization and status indicators to close out the remaining priority-one items.

Summary by Mpho Thwala on behalf of Ahava on 88 Company.

