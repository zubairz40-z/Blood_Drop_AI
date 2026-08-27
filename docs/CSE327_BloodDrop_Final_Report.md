# CSE327 — BloodDrop AI — Final Software Design Report

**Project:** BloodDrop AI — blood & blood‑component donation coordination platform for Bangladesh
**Course:** CSE327 Software Engineering, North South University
**Branch:** `Zubair`
**Stack:** React + Vite (frontend) · Node.js + Express + Mongoose (backend) · MongoDB Atlas · Firebase Auth · Google Gemini · MapLibre/OpenStreetMap · Nodemailer · bKash sandbox

> Everything below is taken from the **actual source code** in this repository. File names, function names, endpoints, models, and test results are real.

---

## 1. Project Overview

### Simple words
A patient needs blood. They open BloodDrop and make a request, choosing the blood group, the component (whole blood / plasma / platelets / double red cells), how many units, which hospital, and how urgent it is. The hospital checks the request is real and **verifies** it. Then BloodDrop's **AI coordination** looks at the map, finds nearby donors who are the right blood type, healthy enough to donate, and available, and picks the best one. That donor gets a **"Emergency Blood Match"** notification with **Accept** and **Decline** buttons. When the donor taps **Accept**, the hospital sees the accepted donor, records the donation, and confirms it. The hospital's blood stock goes up by one unit, the donor's next‑eligible date is pushed forward, the request becomes **FULFILLED**, and the patient sees **FULFILLED** on their tracking page.

### Technical words
```
Patient (React) ── POST /api/requests ─────────────► BloodRequest {status: PENDING_VERIFICATION}
Hospital (React) ─ POST /api/requests/:id/verify ──► BloodRequest {status: VERIFIED}
Patient (React) ── POST /api/ai/coordinate ────────► aiOrchestrator.coordinateRealRequest()
        matchingService.findCandidates()  →  $geoNear + compatibility + eligibility + score
        5 agents run  →  aiManager decides nextAction = CONTACT_PRIMARY_DONOR
        responseService.contactNextDonor()  →  Notification {type: MATCH_FOUND, user: donor._id}
Donor (React) ──── GET /api/notifications ─────────► sees MATCH_FOUND card + Accept / Decline
Donor (React) ──── POST /api/requests/:id/respond ─► acceptMatch()  →  BloodRequest {status: MATCHED}
Hospital (React) ─ POST /api/donations ────────────► Donation {status: PENDING}
Hospital (React) ─ PATCH /api/donations/:id/confirm► confirmDonation()
        Donation {status: CONFIRMED}
        DonorProfile.eligibility[component].nextEligibleAt = +56 days (whole blood)
        BloodInventory units += 1   (upsert)
        BloodRequest {status: FULFILLED}
Patient (React) ── GET /api/requests/:id (polled) ─► sees FULFILLED
```

### The 8 failure paths the design handles (from `CLAUDE.md` + `utils/requestStatus.js`)
Hospital rejects · donor declines · donor never responds (notification `expiresAt`) · donor accepts then withdraws (`releaseDonor`) · donor no‑show · on‑site screening fails (`Deferral`) · no donor found after radius expansion · request expires.

---

## 2. Frontend — Zubair

All files are under `frontend/src/`.

### 2.1 Router / App — `src/routes/AppRoutes.jsx`
- **Purpose:** maps every URL to a page and protects role‑only areas.
- **Important component:** `<ProtectedRoute role="donor">` etc. wraps each dashboard.
- **API called:** none directly.
- **In the UI:** `/patient`, `/donor`, `/hospital`, `/admin`, `/volunteer` each render a layout with nested routes such as `requests/create`, `requests/:requestId/tracking`, `requests/:requestId/coordination`.

```jsx
// src/routes/AppRoutes.jsx  — real routes
<Route path="/patient" element={<ProtectedRoute role="patient"><PatientLayout/></ProtectedRoute>}>
  <Route path="requests/create"                element={<CreateBloodRequest />} />
  <Route path="requests/:requestId/tracking"   element={<RequestTracking />} />
  <Route path="requests/:requestId/coordination" element={<AICoordination />} />
</Route>
```

### 2.2 Login / Register — `src/pages/auth/Login.jsx`, `src/pages/auth/Register.jsx`
- **Purpose:** email/password + Google sign‑in through Firebase, then redirect by role.
- **Important function:** the submit handler calls Firebase, then the backend.
- **API called:** `POST /api/auth/login` / `POST /api/auth/register` (with the Firebase ID token in the header).
- **In the UI:** on success `navigate(DASHBOARD_BY_ROLE[data.user.role])`.

```jsx
// src/pages/auth/Login.jsx  (fields are name="email" / name="password", button type="submit")
const [form, setForm] = useState({ email: '', password: '' })
// ... after Firebase sign-in succeeds and the backend returns the profile:
navigate(DASHBOARD_BY_ROLE[data.user.role] || '/', { replace: true })
```

### 2.3 Firebase auth — `src/config/firebase.js`
- **Purpose:** initialise the Firebase **client** SDK once and expose `auth`.
- **Config:** read from `import.meta.env.VITE_FIREBASE_*` (never hard‑coded).
- **In the UI:** components call `signInWithEmailAndPassword(auth, …)` / `signInWithPopup`.

```js
// src/config/firebase.js  — client config comes from Vite env only
const firebaseConfig = {
  apiKey:      import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:   import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // storageBucket / messagingSenderId / appId ...
}
```

### 2.4 API client — `src/api/client.js`
- **Purpose:** one shared Axios instance; base URL + attach the Firebase token to every request.
- **Important part:** `baseURL` and an interceptor that adds `Authorization: Bearer <idToken>`.

```js
// src/api/client.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
})
// a request interceptor calls auth.currentUser.getIdToken() and sets the header
export default api
```

### 2.5 Patient Create Request — `src/pages/patient/CreateBloodRequest.jsx`
- **Purpose:** the form to file a blood request.
- **Sub‑components:** `BloodRequirementForm` (`#bloodGroup`, `#donationType`, `units`, `neededBy`), `RequestLocationForm` (`#hospital` dropdown + free‑text location), `EmergencyLevelSelector` (NORMAL/URGENT/CRITICAL buttons).
- **API called:** `POST /api/requests` via `createBloodRequest(bloodRequestToApi(form))`.
- **In the UI:** on success it renders `RequestCreatedState` showing the short ID and status `PENDING_VERIFICATION`.

```jsx
// src/pages/patient/CreateBloodRequest.jsx
const saved = await createBloodRequest(bloodRequestToApi(form))   // POST /api/requests
setCreatedRequest(bloodRequestFromApi(saved))                     // show "Request Created"
```
```js
// src/api/mappers.js — bloodRequestToApi() converts UI values to API enums
component: toComponentCode(form.donationType),  // "Whole Blood" -> "WHOLE_BLOOD"
urgency:   toUrgencyCode(form.emergencyLevel),  // "CRITICAL" -> "EMERGENCY"
location:  toGeoJson(form.location),            // {type:"Point", coordinates:[lng,lat]}
```

### 2.6 Request Tracking — `src/pages/patient/RequestTracking.jsx`
- **Purpose:** show the request's current status badge and a "View AI Coordination" button.
- **API called:** `GET /api/requests/:id`, **re‑fetched every 4 seconds** (`setInterval(refreshStatus, 4000)`), so the patient sees `FULFILLED` without a manual refresh.

### 2.7 AI Coordination — `src/pages/patient/AICoordination.jsx`
- **Purpose:** run and display the 5‑agent pipeline result.
- **API called:** `POST /api/ai/coordinate` via `coordinateBloodRequest(requestId)` (only when status is `VERIFIED` or `MATCHING`).
- **In the UI:** 5 agent cards (`AI Manager`, `Donor Matching`, `Eligibility & Scheduling`, `Geo Coordination`, `Risk & Advisor`), a **Best Donor Match** card, a **Notification Status** card (`SENT`), and a `BloodDropMap` with markers.

```jsx
// src/api/aiApi.js
export async function coordinateBloodRequest(requestId) {
  const { data } = await api.post('/api/ai/coordinate', { requestId })
  return data.result           // { agentStatus, bestDonor, selection, candidates, nextAction, ... }
}
```

### 2.8 Donor notifications + Accept/Decline — `src/pages/donor/DonorDashboard.jsx` + `src/components/donor/EmergencyRequestCard.jsx`
- **Purpose:** show `MATCH_FOUND` notifications and let the donor respond.
- **API called:** `GET /api/notifications` on load; `POST /api/requests/:id/respond` on button click.
- **In the UI:** notifications of `type === 'MATCH_FOUND'` render as `EmergencyRequestCard`s. Buttons appear when `request.expiresAt && !expired && !responded`.

```jsx
// src/pages/donor/DonorDashboard.jsx
setMatchNotifications(result.notifications.filter(n => n.type === 'MATCH_FOUND'))
// ...
async function respond(requestId, response) {           // response = 'ACCEPT' | 'DECLINE'
  await respondToMatch(requestId, response)             // POST /api/requests/:id/respond
  const refreshed = await fetchNotifications()
}
```
```jsx
// src/components/donor/EmergencyRequestCard.jsx
const isActionable = request.expiresAt && !expired && !request.responded
{isActionable && (<><Button onClick={() => onDecline(request.id)}>Decline</Button>
                    <Button onClick={() => onAccept(request.id)}>Accept</Button></>)}
```

### 2.9 Hospital Verify — `src/pages/hospital/HospitalRequests.jsx`
- **Purpose:** the verification queue.
- **API called:** `POST /api/requests/:id/verify` (`verifyBloodRequest`), `POST /api/requests/:id/reject`.
- **In the UI:** each `PENDING_VERIFICATION` row has **Verify** / **Reject**. After a donor accepts, the same page shows *"Donor accepted: <name>"* and a **Record Donation** button on `MATCHED` rows.

```jsx
// src/pages/hospital/HospitalRequests.jsx
const updated = await verifyBloodRequest(request.id)          // POST /api/requests/:id/verify
// later, on a MATCHED row:
await createDonation({ requestId: request.id, donorId: request.matchedDonor.id, units: request.unitsRequired })
navigate('/hospital/donations')
```

### 2.10 Hospital Record / Confirm Donation — `src/pages/hospital/HospitalDonations.jsx`
- **Purpose:** the "Pending Confirmation" table with a **Confirm** button per row.
- **API called:** `GET /api/donations/pending` (`fetchPendingDonations`), `PATCH /api/donations/:id/confirm` (`confirmDonation`).

```jsx
// src/pages/hospital/HospitalDonations.jsx
async function handleConfirm(donationId) {
  await confirmDonation(donationId)                      // PATCH /api/donations/:id/confirm
  setDonations(prev => prev.filter(d => d.id !== donationId))
}
```

### 2.11 Map — `src/components/maps/BloodDropMap.jsx`
- **Purpose:** show request / hospital / donor markers on a **MapLibre GL + OpenStreetMap** tile map (no Google Maps key in the browser).
- **API called:** none — it only renders markers passed in as props from the AI Coordination result. Matching itself is done in MongoDB, not on the map.

### 2.12 Gemini chatbot — `src/components/chatbot/*`
- **Purpose:** a public help chatbot.
- **API called:** `POST /api/chat` with `{ message }`.
- **In the UI:** a chat panel; the reply text comes straight from the backend. **No Gemini key is in the frontend.**

### 2.13 bKash / Financial Support — `src/pages/Funding.jsx`
- **Purpose:** charitable **money** donations only (paying donors for blood is illegal — see `CLAUDE.md`). Uses the bKash **sandbox** UI; keys stay server‑side.

---

## 3. How Frontend Connects to Backend

**General path:**
```
React component → src/api/*.js function → Axios (client.js, adds Bearer token)
  → Express route (routes/*.js) → middleware (verifyFirebaseToken [, authorizeRoles])
  → controller (controllers/*.js) → service (services/*.js) → Mongoose model → MongoDB
  → res.json({...}) → Axios response → React setState → UI re-render
```

| # | Feature | Frontend file | Method + Endpoint | Backend route file | Controller / Service | Mongo model | Shown in UI |
|---|---|---|---|---|---|---|---|
| 1 | Create Request | `pages/patient/CreateBloodRequest.jsx` → `api/requestApi.js` | `POST /api/requests` | `routes/requestRoutes.js` | `requestController.createRequest` | `BloodRequest` (+ reads `User` hospital) | "Request Created", status `PENDING_VERIFICATION` |
| 2 | Hospital Verify | `pages/hospital/HospitalRequests.jsx` → `api/requestApi.js` | `POST /api/requests/:id/verify` | `routes/requestRoutes.js` | `requestController.verifyRequest` → `notificationService.notifyRequestVerified` | `BloodRequest`, `Notification` | status badge → `VERIFIED` |
| 3 | AI Coordination | `pages/patient/AICoordination.jsx` → `api/aiApi.js` | `POST /api/ai/coordinate` | `routes/aiRoutes.js` | `aiController.coordinateBloodRequest` → `aiOrchestrator.coordinateRealRequest` → `matchingService` + 5 agents + `responseService.contactNextDonor` | `BloodRequest`, `DonorProfile`, `User`, `Notification` | 5 agent cards, Best Donor, "Notification: SENT" |
| 4 | Donor Accept | `pages/donor/DonorDashboard.jsx` → `api/matchApi.js` | `POST /api/requests/:id/respond` `{response:"ACCEPT"}` | `routes/requestRoutes.js` | `requestController.respondToRequest` → `responseService.acceptMatch` → `matchingService.assignDonor` | `BloodRequest`, `Notification`, `User` | card shows "You accepted"; request → `MATCHED` |
| 5 | Confirm Donation | `pages/hospital/HospitalDonations.jsx` → `api/donationApi.js` | `PATCH /api/donations/:id/confirm` | `routes/donationRoutes.js` | `donationController.confirmDonation` → `donationService.confirmDonation` → `inventoryService.adjustUnits` | `Donation`, `DonorProfile`, `BloodInventory`, `BloodRequest`, `Notification` | row leaves pending list; request → `FULFILLED` |
| 6 | Gemini Chat | `components/chatbot/*` → `api/*` | `POST /api/chat` | `routes/chatRoutes.js` | `chatController.handleChat` → `geminiService.generateGeminiText` | none (no DB) | assistant reply text |

**Concrete example — Hospital Verify:**
```
HospitalRequests.jsx  handleVerify()
  → verifyBloodRequest(id)            // src/api/requestApi.js
  → api.post(`/api/requests/${id}/verify`)          [Bearer <firebase idToken>]
  → routes/requestRoutes.js: router.post('/:id/verify', verifyFirebaseToken, authorizeRoles('hospital'), verifyRequest)
  → requestController.verifyRequest():
       assertTransition(request.status, STATUS.VERIFIED)   // state-machine guard
       request.applyStatus(STATUS.VERIFIED, req.currentUser._id, "Verified by hospital")
       await request.save()
       notificationService.notifyRequestVerified({ userId: patient, request })
  → res.json({ success: true, request })
  → setRequests(prev.map(r => r.id === id ? bloodRequestFromApi(updated) : r))
  → the row's badge changes to VERIFIED
```

---

## 4. Backend — Arefa

All files are under `backend/src/`.

### 4.1 Layers
| Layer | Folder | Job |
|---|---|---|
| Routes | `routes/` | URL → middleware chain → controller |
| Middleware | `middleware/` | `verifyFirebaseToken`, `authorizeRoles` |
| Controllers | `controllers/` | read `req`, validate, call a service, send `res.json` |
| Services | `services/` | the real business logic (no `req`/`res`) |
| Agents | `agents/` | 5 AI agents — thin decision layers over the services |
| Models | `models/` | Mongoose schemas |
| Utils | `utils/` | pure rules: `donationRules.js`, `requestStatus.js` |

### 4.2 App bootstrap — `src/app.js`, `src/server.js`, `src/config/database.js`
```js
// src/app.js
app.use(helmet());
app.use(cors({ origin: /* FRONTEND_URL + any http://localhost:<port> in dev */ }));
app.use(express.json());
app.use("/api/requests", requestRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/chat", chatRoutes);
// ... etc.
```
```js
// src/server.js — starts the HTTP server and the background job
scheduler.start();                       // sweeps expired MATCH_FOUND notifications
// src/config/database.js
await mongoose.connect(process.env.MONGO_URI);   // one shared connection (Singleton-like)
```

### 4.3 Firebase verification — `src/config/firebase.js` + `src/middleware/verifyFirebaseToken.js`
- **Purpose:** *Firebase decides identity; MongoDB decides role.*
- **Main function:** `verifyFirebaseToken(req,res,next)` — reads `Authorization: Bearer <idToken>`, calls `getAuth().verifyIdToken(idToken)`, then loads `User.findOne({ firebaseUid: decoded.uid })` into `req.currentUser`.
- **Input:** HTTP request. **Output:** `req.firebaseUser` (decoded token) + `req.currentUser` (Mongo user) or `401`.
- **Called by:** every protected route.

```js
// src/middleware/verifyFirebaseToken.js
const decoded = await getAuth().verifyIdToken(idToken);   // Firebase Admin SDK
req.firebaseUser = decoded;
req.currentUser  = await User.findOne({ firebaseUid: decoded.uid });   // role lives in Mongo
```
```js
// src/middleware/authorizeRoles.js  — factory that returns a middleware
function authorizeRoles(...allowedRoles) {
  return async (req, res, next) => {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!allowedRoles.includes(user.role))
      return res.status(403).json({ success:false, message:"You do not have permission to do that." });
    req.currentUser = user; next();
  };
}
```

### 4.4 `matchingService.js`
- **Purpose:** turn "a verified request" into "a ranked list of usable donors".
- **Main function:** `findCandidates(requestId, { limit })`.
- **Input:** request id. **Output:** `{ requestId, radiusKm, weights, candidates: [{ donorId, bloodGroup, distanceKm, etaMinutes, score, ... }] }`.
- **Called by:** `aiOrchestrator`, `requestController.startMatching`, `donorMatchingAgent`.

(Full logic in §6.)

### 4.5 `aiOrchestrator.js`
- **Purpose:** run the whole 5‑agent coordination in one call, then actually contact the donor.
- **Main function:** `coordinateRealRequest({ requestId })`.
- **Output:** `{ agentStatus, recommendedDonor, bestDonor, backupDonors, selection, candidates, nextAction, emailStatus, contactResult, ... }`.
- **Called by:** `aiController.coordinateBloodRequest` (`POST /api/ai/coordinate`).

### 4.6 `responseService.js`
- **Purpose:** the donor‑contact and donor‑response state changes.
- **Main functions:**
  - `contactNextDonor({ requestId, contactOrder, wave, actorId })` → `beginMatching` (→ status `MATCHING`) → `notificationService.notifyMatchFound` → try email. Returns `{ contacted, wave, expiresAt, notificationId, emailStatus }`.
  - `acceptMatch({ requestId, donorUserId })` → requires status `MATCHING`, requires a `MATCH_FOUND` for that donor, not expired → `matchingService.assignDonor` (→ status `MATCHED`).
  - `declineMatch`, `sweepExpired`, `releaseNoShow`.

### 4.7 `notificationService.js`
- **Purpose:** the one place that creates `Notification` rows, so wording and deadlines are consistent.
- **Main function:** `notifyMatchFound({ donorUserId, request, wave })` → `Notification.create({ user: donorUserId, type: "MATCH_FOUND", request: request._id, expiresAt })`.
- `expiryFor(urgency)` → **2 min** for `EMERGENCY`, **5 min** otherwise.

### 4.8 `donationService.js`
- **Purpose:** record and confirm donations; the **only** place eligibility changes.
- `createDonation(...)` → requires request status `MATCHED` → `checkEligibility` → `Donation.create({ status: "PENDING" })`.
- `confirmDonation({ donationId, hospitalId })`:
  1. `Donation.status = "CONFIRMED"`
  2. per‑component eligibility: `entry.nextEligibleAt = calculateNextEligibleAt(component, donatedAt)` (e.g. +56 days for whole blood); `entry.donationsThisYear = countConfirmedThisYear(...)`; `profile.totalDonations += 1`
  3. `inventoryService.adjustUnits(hospital, bloodGroup, component, +units)`
  4. `request.unitsFulfilled += units`; if `>= unitsRequired` and the transition is legal → `applyStatus(STATUS.FULFILLED)`; notify patient.

### 4.9 `inventoryService.js`
- **Purpose:** hospital blood stock.
- **Main function:** `adjustUnits(hospitalId, bloodGroup, component, delta)`.
- Adding stock (`delta >= 0`) **upserts** the `(hospital, bloodGroup, component)` row (`$inc` + `upsert:true`), so a confirmed donation always updates stock even if the hospital never initialised its inventory. Removing stock keeps a guarded, non‑upserting update that refuses to go below 0.

### 4.10 Eligibility logic — `src/utils/donationRules.js`
- **Purpose:** deterministic medical rules — **never** decided by an LLM.
- Key data / functions: `RED_CELL_COMPATIBILITY`, `PLASMA_COMPATIBILITY` (opposite directions), `DEFERRAL_DAYS` `{WHOLE_BLOOD:56, PLASMA:28, PLATELETS:7, DOUBLE_RED_CELLS:112}`, `compatibleDonorGroups(recipient, component)`, `isCompatible(...)`, `checkEligibility(profile, component, asOf)`, `estimateEtaMinutes(km)` (25 km/h), `calculateNextEligibleAt(component, date)`.

```js
// src/utils/donationRules.js — per-component waiting period + deferrals
function checkEligibility(profile, component, asOf = new Date()) {
  const reasons = [];
  if (!profile.donationTypes?.includes(component)) reasons.push("Donor does not offer this component");
  // age (18–65), weight (>= per-component minimum) ...
  const entry = (profile.eligibility || []).find(e => e.component === component);
  if (entry?.nextEligibleAt && new Date(entry.nextEligibleAt) > asOf)
    reasons.push(`Deferred until ${new Date(entry.nextEligibleAt).toISOString().split("T")[0]}`);
  if (entry?.medicallyDeferredUntil && new Date(entry.medicallyDeferredUntil) > asOf)
    reasons.push("Medically deferred ...");
  return { eligible: reasons.length === 0, reasons, nextEligibleAt: reasons.length ? entry?.nextEligibleAt : null };
}
```

### 4.11 Gemini service — `src/services/geminiService.js`
- **Purpose:** wrap the `@google/genai` SDK behind one function.
- **Main function:** `generateGeminiText(prompt)` → `client.models.generateContent({ model: "gemini-3.6-flash", ... })` → returns the response text.
- **Called by:** `chatController.handleChat` only.

---

## 5. Database / Models

All under `backend/src/models/`.

| Model | Key fields | Notes |
|---|---|---|
| `User` | `firebaseUid` (unique), `email`, `name`, `role` (`patient`/`donor`/`hospital`/`volunteer`/`admin`), `bloodGroup`, `accountStatus`, `location` (GeoJSON) | **Hospital = a `User` with `role: "hospital"`** — there is no separate Hospital collection. |
| `DonorProfile` | `user` → `User._id` (**unique**, required), `dateOfBirth`, `weightKg`, `bloodGroup`, `donationTypes[]`, `eligibility[]` (one entry per component: `nextEligibleAt`, `medicallyDeferredUntil`, `donationsThisYear`), `location` (GeoJSON), `isAvailable`, `totalDonations` | `DonorProfile.user` is the link to `User`. |
| `BloodRequest` | `patient`→User, `hospital`→User, `createdBy`→User, `bloodGroup`, `component`, `unitsRequired`, `unitsFulfilled`, `urgency`, `neededBy`, `status`, `location` (GeoJSON — copied from the hospital), `matchedDonor`→User, `statusHistory[]` | `statusHistory` is append‑only audit. |
| `Notification` | `user`→User (**recipient**), `type` (`MATCH_FOUND`, `DONOR_ACCEPTED`, `REQUEST_VERIFIED`, `REQUEST_FULFILLED`, …), `request`→BloodRequest, `read`, `expiresAt`, `wave` | `MATCH_FOUND` is the only one with `expiresAt`. |
| `Donation` | `donor`→User, `request`→BloodRequest, `hospital`→User, `component`, `units`, `status` (`PENDING`/`CONFIRMED`/`CANCELLED`), `donatedAt`, `confirmedAt` | Created `PENDING`, confirmed later. |
| `BloodInventory` | `hospital`→User, `bloodGroup`, `component`, `units` | Unique compound index `(hospital, bloodGroup, component)`. |
| `Deferral` | `donor`→User, `reasonCode`, `type` (`temporary`/`permanent`), `startDate`, `endDate`, `source` (`self`/`hospital`/`admin`) | Written by on‑site screening failures etc. |

### Relationships (text diagram)
```
User(role:donor) 1───1 DonorProfile     (DonorProfile.user === User._id)
User(role:hospital) 1───* BloodRequest  (BloodRequest.hospital)
User(role:patient)  1───* BloodRequest  (BloodRequest.patient)
BloodRequest 1───* Notification         (Notification.request)   Notification.user = the donor's User._id
BloodRequest 1───* Donation             (Donation.request)
User(hospital) 1───* BloodInventory
User(donor) 1───* Deferral
```

### GeoJSON + geo index
Mongo stores points as **`{ type: "Point", coordinates: [longitude, latitude] }`** — longitude first (the opposite of how people say "lat, lng"). Both `DonorProfile` and `BloodRequest` declare:
```js
schema.index({ location: "2dsphere" });   // enables geo queries
```
`$geoNear` (an aggregation stage) uses that `2dsphere` index to return documents **sorted by real spherical distance** from a point, with the distance attached — in one database call, instead of loading every donor into Node and computing Haversine by hand.

---

## 6. Donor Matching — actual logic (`src/services/matchingService.js`)

Steps inside `findCandidates(requestId, { limit })`:

1. Load the request; **reject** unless status is `VERIFIED` or `MATCHING`; **reject** if it has no coordinates.
2. `baseRadiusKm = SEARCH_RADIUS_KM[urgency]` → `EMERGENCY 50`, `URGENT 25`, `ROUTINE 10`.
3. `acceptableGroups = compatibleDonorGroups(request.bloodGroup, request.component)` — picks the **red‑cell** or **plasma** table by component.
4. **Radius expansion:** try `1×`, then `2×`, then `3×` the base radius, capped at **60 km**, stopping at the first level that yields candidates.
5. For each level, run **`$geoNear`** filtering in the DB on `bloodGroup ∈ acceptableGroups`, `donationTypes` contains the component, `isAvailable: true`.
6. In Node, for each nearby donor run **`checkEligibility(donor, component, asOf)`** — skips anyone deferred / medically deferred / under age / under weight.
7. **Score & rank:** `score = scoreDistance(distanceKm, radiusKm, weights.distance) + scoreHistory(totalDonations, weights.history)`, where `WEIGHTS` change with urgency (`EMERGENCY {distance:90, history:10}` … `ROUTINE {distance:55, history:45}`). Sort by score, ties broken by distance.
8. Return `candidates.slice(0, limit)`. The **first** is the primary; the rest are backups / contact‑order.

```js
// src/services/matchingService.js — the geo funnel (real code, trimmed)
nearby = await DonorProfile.aggregate([
  { $geoNear: {
      near: { type: "Point", coordinates: coords },     // [lng, lat] from the request
      distanceField: "distanceMeters",
      maxDistance: radiusKm * 1000,
      spherical: true,
      query: {                                          // DB-side pre-filter
        bloodGroup: { $in: acceptableGroups },
        donationTypes: request.component,
        isAvailable: true,
      },
  }},
  { $limit: 50 },
]);
for (const donor of nearby) {
  const verdict = checkEligibility(donor, request.component, asOf);   // deterministic rules
  if (!verdict.eligible) continue;
  const distanceKm = Math.round((donor.distanceMeters / 1000) * 10) / 10;
  const score = scoreDistance(distanceKm, radiusKm, weights.distance)
              + scoreHistory(donor.totalDonations, weights.history);
  candidates.push({ donorId: String(donor.user), distanceKm, etaMinutes: estimateEtaMinutes(distanceKm), score, /* ... */ });
}
candidates.sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);
```

---

## 7. The Five AI Agents

**Gemini is NOT one of the agents.** The 5 agents are deterministic Node.js modules in `backend/src/agents/`. Gemini is a separate conversational chatbot (§10).

| # | Agent | File | Function | Input | Output | What it does |
|---|---|---|---|---|---|---|
| 1 | **AI Manager** | `agents/aiManager.js` | `coordinate({ requestId, matchingResult, riskResult })` | matching candidates + risk result | `{ recommendedDonor, backupDonors, nextAction, explanation, risk }` | Filters candidates to *viable* ones (`eligible && available`), then decides `nextAction`: `CONTACT_PRIMARY_DONOR` / `EXPAND_SEARCH` / `NO_ELIGIBLE_CANDIDATES` / `MANUAL_REVIEW_REQUIRED` (the last one if risk is `CRITICAL`). |
| 2 | **Donor Matching** | `agents/donorMatchingAgent.js` | `selectDonors(requestId, { candidateSet })` | the **funnel result object** `{ candidates: [...] }` | `{ primary, backups, contactOrder, decisive, margin }` | Takes the already‑ranked list and picks primary + 2 backups + the ordered `contactOrder` the notification layer walks through. It never invents a donor. |
| 3 | **Geo Coordination** | `agents/geoCoordinationAgent.js` | `coordinate(requestId, { candidateSet, neededBy })` | funnel result + deadline | `{ preferred, backup, byEta, reachableCount, spreadKm }` | Re‑sorts candidates by **ETA** and reports how many can reach the hospital before `neededBy`. |
| 4 | **Eligibility & Scheduling** | `agents/eligibilitySchedulingAgent.js` | `assessDonors(requestId, { donorIds, candidateSet })` | candidate ids | `{ eligibleNow, later, excluded, sufficient }` | Buckets donors into eligible‑now / eligible‑on‑a‑future‑date / permanently‑excluded, all via `checkEligibility`. Contains **no** medical logic of its own. |
| 5 | **Risk & Advisor** | `agents/riskAdvisorAgent.js` | `analyzeRisk(riskContext)` | DB signals (recent/emergency/cancelled request counts, blood‑group demand, emergency wait minutes) | `{ riskScore, riskLevel, reasons[], recommendation }` | Operational risk only (`LOW`…`CRITICAL`); it never judges medical eligibility. |

### `aiOrchestrator.coordinateRealRequest({ requestId })` — the sequence
```
1. request = db.findBloodRequestById(requestId)
2. matchingResult = matchingService.findCandidates(requestId, { limit: 20 })
3. Promise.all([
     eligibilitySchedulingAgent.assessDonors(requestId, { donorIds, candidateSet: matchingResult }),
     geoCoordinationAgent.coordinate(requestId,   { candidateSet: matchingResult }),
     donorMatchingAgent.selectDonors(requestId,   { candidateSet: matchingResult }),   //  <-- see bug below
   ])
4. riskResult = riskAdvisorAgent.analyzeRisk(buildRiskContext(request))
5. result = aiManager.coordinate({ requestId, matchingResult, riskResult })
6. if (result.nextAction === "CONTACT_PRIMARY_DONOR" && request.status === "VERIFIED")
       responseService.contactNextDonor({ requestId, contactOrder: selection.contactOrder, wave: 1, actorId: request.hospital })
```

### 7.1 The final bug that was fixed (viva language)

**Before:** step 3 called
```js
donorMatchingAgent.selectDonors(requestId, { candidateSet: candidates })   // candidates = matchingResult.candidates  ← an ARRAY
```
Inside the agent the very first line is `const candidates = result.candidates || [];`. When you pass an **array**, `array.candidates` is `undefined`, so the agent thought there were **zero** donors and returned:
```
primary: null
backups: []
contactOrder: []
```
Because `contactOrder` was empty, the orchestrator's `if (contactOrder.length > 0)` was false, so **`responseService.contactNextDonor()` never ran**. That meant:
- no `MATCH_FOUND` `Notification` was created,
- the donor's dashboard showed nothing,
- there was no Accept/Decline,
- the request was stuck at "CONTACTING DONOR" forever.

The AI Coordination page *looked* fine because the "best donor" card is filled from `matchingResult.candidates` directly by the AI Manager — but nobody was actually contacted.

**After (the fix in `aiOrchestrator.js`):**
```js
// pass the WHOLE funnel result object, not the bare array,
// so selectDonors can read `candidateSet.candidates`
donorMatchingAgent.selectDonors(requestId, { candidateSet: matchingResult })
```
Now `selectDonors` returns a real `primary` and a real `contactOrder: [donorId, backup1, backup2]`. A safety fallback was also added: if `contactOrder` is somehow still empty but the Manager has a `recommendedDonor`, build the order from `recommendedDonor + backupDonors`. The orchestrator then calls `responseService.contactNextDonor(...)`, which:
1. moves the request to `MATCHING`,
2. creates `Notification { type: "MATCH_FOUND", user: <donor User._id>, request: <this request>, expiresAt }`,
3. tries to send an email (non‑blocking).

A second small fix: `contactNextDonor` now checks for an existing live `MATCH_FOUND` for the same donor+request and reuses it, so repeated polling of the coordination page cannot create duplicate notifications or duplicate emails.

**Proof:** the Playwright golden‑flow run (`golden-flow-playwright.js`) reaches `FULFILLED` end‑to‑end, and a DB check confirms `Notification.user === selected donor's User._id` and `Notification.request === this request`.

---

## 8. Notification & Donor Accept Flow

```
matchingService picks best donor  →  donorMatchingAgent.contactOrder = [bestDonorUserId, ...]
  → responseService.contactNextDonor({ contactOrder, wave: 1 })
      → matchingService.beginMatching()      → BloodRequest.status = MATCHING
      → notificationService.notifyMatchFound()
            Notification.create({ user: donorUserId, type: "MATCH_FOUND", request: request._id, expiresAt })
      → emailService.sendMatchFound(...)      // try/catch — failure is swallowed
  → Donor frontend: GET /api/notifications  (notificationController.getMyNotifications filters { user: req.currentUser._id })
  → DonorDashboard shows the MATCH_FOUND card with Accept / Decline
  → Donor clicks Accept → POST /api/requests/:id/respond { response: "ACCEPT" }
      → responseService.acceptMatch(): status must be MATCHING; a MATCH_FOUND for this donor must exist and not be expired
      → matchingService.assignDonor()        → BloodRequest.status = MATCHED, matchedDonor = donorUserId
      → notificationService.notifyDonorAccepted({ userId: patient })
```

**Why email failure does not block the notification:** in `responseService.contactNextDonor` the `Notification.create(...)` happens **first**; only afterwards is `emailService.sendMatchFound(...)` called, and that call is wrapped in `try { ... } catch { emailStatus = "FAILED" }`. `emailService.getTransporter()` returns `null` when `SMTP_HOST/USER/PASS` are not set, and `sendMail` then returns `{ sent: false, reason: "not_configured" }`. So the result can be `Notification: SENT` + `Email: NOT_CONFIGURED`, and the donor still sees the request in the app.

---

## 9. After Donor Accept

```
Donor Accept  → BloodRequest.status = MATCHED, matchedDonor set
  → Hospital opens /hospital/requests → "Active requests" row shows "Donor accepted: <name>" + [Record Donation]
      → POST /api/donations { requestId, donorId, units }              (donationController.createDonation → donationService.createDonation)
          requires request.status === MATCHED
          checkEligibility(profile, component)  (hospital can override with a written reason)
          Donation.create({ status: "PENDING" })
      → navigate('/hospital/donations')
  → Hospital /hospital/donations → "Pending Confirmation" table → [Confirm]
      → PATCH /api/donations/:id/confirm                              (donationController.confirmDonation → donationService.confirmDonation)
          Donation.status = "CONFIRMED"
          DonorProfile.eligibility[component].nextEligibleAt = calculateNextEligibleAt(component, donatedAt)   // +56d whole blood
          DonorProfile.totalDonations += 1
          inventoryService.adjustUnits(hospital, bloodGroup, component, +units)   // upsert → BloodInventory.units += 1
          BloodRequest.unitsFulfilled += units
          if (unitsFulfilled >= unitsRequired) → applyStatus(STATUS.FULFILLED) + notifyRequestFulfilled(patient)
  → Patient /patient/requests/:id/tracking (polls GET /api/requests/:id every 4s) → status badge = FULFILLED
```

**Files involved:** frontend `HospitalRequests.jsx`, `HospitalDonations.jsx`, `RequestTracking.jsx`; backend `donationController.js`, `donationService.js`, `inventoryService.js`, `notificationService.js`; models `Donation`, `DonorProfile`, `BloodInventory`, `BloodRequest`, `Notification`.

---

## 10. Gemini Chatbot

```
Frontend chat panel (src/components/chatbot/*)
  → POST /api/chat   { message }
  → src/routes/chatRoutes.js         router.post("/", handleChat)      // public, no auth
  → src/controllers/chatController.js handleChat()  (validates length ≤ 2000, adds SYSTEM_PROMPT)
  → src/services/geminiService.js    generateGeminiText(prompt)
  → new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })   // @google/genai SDK
  → client.models.generateContent({ model: "gemini-3.6-flash", ... })
  → Google Gemini API
  → response text → res.json(...) → React renders the reply
```

- **Files:** `frontend/src/components/chatbot/*`, `backend/src/routes/chatRoutes.js`, `backend/src/controllers/chatController.js`, `backend/src/services/geminiService.js`.
- **Method:** `geminiService.generateGeminiText(prompt)` → `client.models.generateContent(...)`.
- **Model name:** `"gemini-3.6-flash"`.
- **Environment variable:** `GEMINI_API_KEY` (in `backend/.env` only — never `VITE_` prefixed, never in browser code).

**Why the key stays in the backend:** anything shipped to the browser is public. If the Gemini key were in frontend code, anyone could copy it from the page source and run up the bill. The browser talks only to our own `POST /api/chat`; the backend holds the key and talks to Google.

**Gemini vs the 5 agents:**
| | Gemini chatbot | 5 AI agents |
|---|---|---|
| Job | free‑text conversation / help | operational decisions (match, rank, risk, contact) |
| Location | `services/geminiService.js`, called only by `chatController` | `agents/*.js`, called by `aiOrchestrator` |
| Touches the DB / changes state? | **No** | Yes (via the deterministic services) |
| Deterministic? | No (LLM) | Yes (plain rules + tests) |

---

## 11. CSE327 Design Patterns

### PATTERNS WE CAN SAFELY SAY
**Facade · Adapter (wrapper) · Singleton · Strategy‑like (weight/table selection).**

---

### Pattern 1 — Facade
- **Type:** Structural (GoF).
- **Simple definition:** one simple front‑door object/function that hides a group of complex subsystems behind it.
- **Where used:** `aiOrchestrator.coordinateRealRequest()` is the single entry point the controller calls; behind it sit `matchingService`, four agents, `riskAdvisorAgent`, `aiManager`, and `responseService`.
- **File:** `backend/src/services/aiOrchestrator.js`

```js
// backend/src/services/aiOrchestrator.js
// PATTERN: FACADE — one function hides matching + 5 agents + risk + contact.
async function coordinateRealRequest({ requestId }) {
  const request        = await db.findBloodRequestById(requestId);
  const matchingResult = await matchingService.findCandidates(requestId, { limit: 20 });   // subsystem 1
  const [eligibilityResult, geoResult, selection] = await Promise.all([
    eligibilitySchedulingAgent.assessDonors(requestId, { candidateSet: matchingResult }),  // subsystem 2
    geoCoordinationAgent.coordinate(requestId,   { candidateSet: matchingResult }),          // subsystem 3
    donorMatchingAgent.selectDonors(requestId,   { candidateSet: matchingResult }),          // subsystem 4
  ]);
  const riskResult = riskAdvisorAgent.analyzeRisk(await buildRiskContext(request));          // subsystem 5
  const result     = aiManager.coordinate({ requestId, matchingResult, riskResult });        // subsystem 6
  if (result.nextAction === "CONTACT_PRIMARY_DONOR" && request.status === "VERIFIED")
    await responseService.contactNextDonor({ requestId, contactOrder: selection.contactOrder, wave: 1 }); // subsystem 7
  return result;   // caller only ever sees this one object
}
```
- **Why it fits:** `aiController` knows nothing about agents, radius expansion, or notifications — it calls one function and gets one result object.
- **Viva answer:** *"The AI Orchestrator is a Facade. The controller calls one method, `coordinateRealRequest`, and that method coordinates the matching service, the five agents, and the response service. The controller does not need to know the order or the details."*

---

### Pattern 2 — Adapter (wrapper around an external library/API)
- **Type:** Structural (GoF).
- **Simple definition:** a small class/module that converts a third‑party API into the shape our app wants, so the rest of the app never touches the third‑party API directly.
- **Where used:**
  - `geminiService.js` wraps `@google/genai` → the app only calls `generateGeminiText(prompt)`.
  - `emailService.js` wraps `nodemailer` → the app only calls `sendMatchFound(...)`, `sendDonationConfirmed(...)`.
  - `config/firebase.js` + `verifyFirebaseToken.js` wrap `firebase-admin` → routes only see `req.currentUser`.
- **File:** `backend/src/services/geminiService.js` (also `emailService.js`)

```js
// backend/src/services/geminiService.js
// PATTERN: ADAPTER — hides the @google/genai SDK behind one project function.
const { GoogleGenAI } = require("@google/genai");
async function generateGeminiText(prompt) {
  const client   = getClient();                                     // SDK object
  const response = await client.models.generateContent({           // SDK-specific call
    model: "gemini-3.6-flash",
    contents: prompt,
  });
  return response.text;                                            // our simple shape: a string
}
```
```js
// backend/src/services/emailService.js
// PATTERN: ADAPTER — nodemailer details hidden; callers just call sendMatchFound(...)
async function sendMail({ to, subject, html }) {
  const transport = getTransporter();
  if (!transport) return { sent: false, reason: "not_configured" };   // no SMTP env vars
  try { await transport.sendMail({ from: FROM, to, subject, html }); return { sent: true }; }
  catch (err) { return { sent: false, error: err.message }; }
}
```
- **Why it fits:** if we swap Gemini for another model, or nodemailer for another mailer, only these adapter files change; agents, controllers, and services stay the same.
- **Viva answer:** *"`geminiService` and `emailService` are Adapters. They translate an external SDK into a tiny project‑specific function. The business code depends on our function, not on Google's or nodemailer's API."*

---

### Pattern 3 — Singleton
- **Type:** Creational (GoF).
- **Simple definition:** make sure a resource is created **once** and the whole app reuses that same instance.
- **Where used:**
  - Firebase Admin app — `config/firebase.js` calls `initializeApp(...)` **once at module load**; every `require` gets the same initialised app.
  - Gemini client — `geminiService.js` memoises `genai` in a module variable (`getClient()` returns the cached one).
  - Mongo connection — `config/database.js` calls `mongoose.connect(...)` once; `mongoose` keeps one connection pool.
- **File:** `backend/src/config/firebase.js`

```js
// backend/src/config/firebase.js
// PATTERN: SINGLETON — Firebase Admin is initialised exactly once for the process.
const { initializeApp, cert } = require("firebase-admin/app");
const serviceAccount = require("../../serviceAccountKey.json");
initializeApp({ credential: cert(serviceAccount) });      // runs one time, on first require
```
```js
// backend/src/services/geminiService.js
// PATTERN: SINGLETON — one lazily-created GoogleGenAI client, reused for every chat call.
let genai = null;
function getClient() {
  if (genai) return genai;                                // reuse
  genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return genai;
}
```
- **Why it fits:** Node caches modules, so `initializeApp` runs once; re‑initialising Firebase Admin would actually throw. The Gemini client is explicitly cached.
- **Viva answer:** *"Firebase Admin and the Gemini client are Singletons. They are created once and reused, because creating them again is wasteful and, for Firebase, an error."*

---

### Pattern 4 — Strategy‑like (interchangeable rule sets chosen at runtime)
- **Type:** Behavioural (GoF Strategy), used in a lightweight, data‑driven way.
- **Simple definition:** keep several interchangeable algorithms/rule sets, and pick one at runtime based on context.
- **Where used:**
  - `matchingService.WEIGHTS` — a different scoring weight set per urgency, selected by key.
  - `donationRules.compatibleDonorGroups` — chooses the **plasma** table or the **red‑cell** table by component (they run in opposite directions).
- **File:** `backend/src/services/matchingService.js`, `backend/src/utils/donationRules.js`

```js
// backend/src/services/matchingService.js
// PATTERN: STRATEGY (data-driven) — pick the scoring weights for THIS request's urgency.
const WEIGHTS = {
  EMERGENCY: { distance: 90, history: 10 },   // in an emergency, nearness is everything
  URGENT:    { distance: 75, history: 25 },
  ROUTINE:   { distance: 55, history: 45 },   // routine: prefer a proven donor
};
const weights = WEIGHTS[request.urgency] ?? WEIGHTS.URGENT;
const score = scoreDistance(distanceKm, radiusKm, weights.distance)
            + scoreHistory(donor.totalDonations, weights.history);
```
```js
// backend/src/utils/donationRules.js
// PATTERN: STRATEGY — choose the compatibility table by component (opposite directions!).
function compatibleDonorGroups(recipientGroup, component) {
  const table = component === "PLASMA" ? PLASMA_COMPATIBILITY : RED_CELL_COMPATIBILITY;
  return table[recipientGroup];
}
```
- **Why it fits:** the caller does not use `if/else` chains of scoring code; it looks up the right rule set and applies it. Swapping in a new urgency band is a one‑line data change.
- **Viva answer:** *"Matching uses a Strategy‑style choice: the scoring weights and the compatibility table are selected at runtime from the request's urgency and component. The algorithm shape stays the same; only the parameters/table change."*
- **Honest note for the viva:** this is *data‑driven* Strategy (lookup tables), not the full "interface + concrete classes" GoF form. Say that if asked.

---

### PATTERNS WE SHOULD NOT CLAIM
| Pattern | Status | Why |
|---|---|---|
| **Abstract Factory** | **NOT USED** | No family‑of‑related‑objects factory anywhere. |
| **Simple Factory** | **NOT a formal implementation** | `authorizeRoles(...roles)` returns a middleware function (a closure factory), and `notificationService` has small `notifyX` creators — mention as *factory functions* only, not the GoF pattern. |
| **Builder** | **NOT USED** | Objects are built with plain object literals / `Model.create({...})`, no step‑by‑step builder. |
| **Decorator** | **NOT USED for our objects** | Express middleware *chains* behaviour, but we do not wrap our own objects with decorators. |
| **Observer** | **NOT USED (as GoF)** | `Notification` rows are written to Mongo and the frontend **polls** `GET /api/notifications` every few seconds — there is no subject/observer subscription, no event emitter push. |
| **State (GoF)** | **NOT USED** | Status transitions are a table (`ALLOWED_TRANSITIONS`) + guard function, not one class per state (see §12). |

---

## 12. Other Software Design Concepts

| Concept | Where it shows in BloodDrop |
|---|---|
| **Layered Architecture** | `routes → middleware → controllers → services → models`. Each layer only talks to the next. |
| **Service Layer** | All business logic lives in `services/*` (and `agents/*`), never in controllers or models. Controllers just translate HTTP ↔ service calls. |
| **Middleware Pattern** | `router.post('/:id/verify', verifyFirebaseToken, authorizeRoles('hospital'), verifyRequest)` — a request passes through a chain; any link can stop it (`401`/`403`). |
| **State Machine** | `utils/requestStatus.js`: `ALLOWED_TRANSITIONS` map + `assertTransition(from,to)` guard + append‑only `statusHistory`. |
| **Separation of Concerns** | Auth (Firebase) is separate from role (Mongo); medical rules (`donationRules.js`) are separate from agents; map rendering is separate from matching. |
| **Single Responsibility** | `notificationService` only makes notifications; `inventoryService` only moves stock; `matchingService` only ranks donors. |
| **High Cohesion** | Everything about eligibility timing is in `donationRules.checkEligibility` + `DonorProfile.eligibility[]`. |
| **Low Coupling** | Agents depend on `matchingService`'s *result shape*, not its internals; the controller depends on `aiOrchestrator`'s one function. |
| **Modularity** | Small files, one export each; the 5 agents can be tested independently. |

### Why the status flow is a *State Machine*, not the GoF *State Pattern*
```
PENDING_VERIFICATION → VERIFIED → MATCHING → MATCHED → FULFILLED
        │                 │          │  ▲                  (also: REJECTED / CANCELLED / EXPIRED)
        └── REJECTED      └── ...    └──┘ (MATCHED→MATCHING on no-show)
```
It **is** a finite state machine: a fixed set of states, and only certain moves are legal — enforced by:
```js
// backend/src/utils/requestStatus.js
const ALLOWED_TRANSITIONS = {
  PENDING_VERIFICATION: ["VERIFIED", "REJECTED", "CANCELLED", "EXPIRED"],
  VERIFIED:  ["MATCHING", "CANCELLED", "EXPIRED"],
  MATCHING:  ["MATCHED", "CANCELLED", "EXPIRED"],
  MATCHED:   ["MATCHING", "FULFILLED", "CANCELLED"],
  FULFILLED: [], REJECTED: [], CANCELLED: [], EXPIRED: [],
};
function assertTransition(from, to) {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) { const e = new Error(`Cannot change from ${from} to ${to}.`); e.status = 409; throw e; }
}
```
It is **not** the GoF **State Pattern** because there is no `abstract State` class with one subclass per state, each holding its own behaviour. BloodDrop keeps the rules as **data (a table) + one guard function** — simpler, and easy to unit‑test.

---

## 13. Unit Testing

- **Unit test** — tests one small pure function in isolation (no DB, no network). Example: blood compatibility.
- **Integration test** — tests a service/route together with its collaborators (DB, other services). Example: the orchestrator + agents; inventory service.
- **End‑to‑End (E2E) test** — drives the real UI in a real browser through the whole flow. Example: the Playwright golden flow.

**AAA = Arrange (set up inputs) → Act (call the function) → Assert (check the output).**

Test runner: `node --test` (`npm test` → `node --test tests/*.test.js`). **Real result:** full suite **332 tests, all passing** (after fixing 2 stale‑contract tests during this work). Key files checked in isolation: `inventoryService.test.js` = **24/24 pass**, `aiOrchestratorReal.test.js` = **22/22 pass**.

| # | Purpose | Arrange | Act | Assert | Actual file | Result |
|---|---|---|---|---|---|---|
| 1 | **Blood compatibility** direction is correct per component | recipient `A+`, component `WHOLE_BLOOD` | `compatibleDonorGroups("A+", "WHOLE_BLOOD")` | equals `["O-","O+","A-","A+"]`; and `compatibleDonorGroups("A+","PLASMA")` differs (opposite table) | `backend/tests/donationRules.test.js` | PASS |
| 2 | **GeoJSON validation** rejects bad coordinates | a point `[200, 10]` (lng out of range) / `[0,0]` / wrong length | run the model/validator on `location` | invalid coordinates are rejected; a valid `{type:"Point",coordinates:[lng,lat]}` is accepted | `backend/tests/geoValidation.test.js`, `geoValidationUtils.test.js` | PASS |
| 3 | **Eligibility** blocks a deferred donor | `DonorProfile` with `eligibility[WHOLE_BLOOD].nextEligibleAt` in the future | `checkEligibility(profile, "WHOLE_BLOOD", now)` | `{ eligible: false, reasons: ["Deferred until ..."] }` | `backend/tests/donationRules.test.js` | PASS |
| 4 | **Role authorization** stops the wrong role | fake `req.firebaseUser` for a `donor`; route needs `hospital` | run `authorizeRoles("hospital")` middleware | responds `403 "You do not have permission..."`, `next()` not called | `backend/tests/authorization.test.js` | PASS |
| 5 | **Notification recipient** is the donor's User id + no duplicates | mocked request/agents; call the real orchestrator path | `coordinateRealRequest({ requestId })` then inspect `selection` / contact | `selectDonors` receives `{ candidateSet: { candidates: [...] } }` (object, not array); primary/contactOrder are populated | `backend/tests/aiOrchestratorReal.test.js` | PASS |
| 6 | **Inventory upsert** on a confirmed donation | no existing `BloodInventory` row; `adjustUnits(hosp, "O+", "WHOLE_BLOOD", +1)` | call `adjustUnits` | `findOneAndUpdate` is called with `{ new: true, upsert: true }` and `$inc: { units: 1 }` (positive delta creates the row) | `backend/tests/inventoryService.test.js` | PASS (24/24) |

---

## 14. Playwright Golden Flow (proven)

Script: **`golden-flow-playwright.js`** (repo root). It uses 3 separate browser contexts (patient / hospital / donor) and asserts DB state at each step via `backend/scripts/mongo-proof.js`.

```
PATIENT  login → /patient/requests/create → O+ / WHOLE_BLOOD / 1 unit / URGENT / Square Hospital (Panthapath)
         → POST /api/requests  →  status PENDING_VERIFICATION            [01, 02]
HOSPITAL login → /hospital/requests → click Verify → status VERIFIED     [03]
PATIENT  open /patient/requests/:id/coordination → POST /api/ai/coordinate
         → 5 agents COMPLETED, best donor 0.1 km, 3 candidates           [04, 05, 06]
DB check → MATCH_FOUND count = 1, recipient = donor User._id, expiry valid, identity allMatch=true   [07]
DONOR    login (the exact selected donor) → /donor → "Emergency Blood Matches" card + Accept + Decline
         → click Accept → request MATCHED                                [08, 09]
HOSPITAL /hospital/requests → "Donor accepted: Nusrat Rahman" → Record Donation
         → /hospital/donations → Confirm → Donation CONFIRMED            [10, 11]
         → inventory O+ WHOLE_BLOOD units += 1 ; donor nextEligibleAt = +56 days ; request FULFILLED
PATIENT  /patient/requests/:id/tracking (polls) → shows FULFILLED        [12]
```

**Proof screenshots:** `test-screenshots/final-working-flow/` — `01-patient-create.png` … `12-patient-fulfilled.png` (plus `07-match-found-mongo-proof.png` showing the DB record, and `_log.txt`).

Support scripts (not production code): `backend/scripts/prepare-golden-demo.js` (idempotent Panthapath demo alignment — repairs existing `@blooddrop.test` accounts only, never wipes), `backend/scripts/golden-flow-api.js` (34 API‑level checks, all pass), `backend/scripts/mongo-proof.js`, `backend/scripts/cleanup-golden-test-data.js`.

---

## 15. Important Code to Show Faculty

### ZUBAIR — FRONTEND (open these, in order)

| File | Point at | Say |
|---|---|---|
| `frontend/src/routes/AppRoutes.jsx` | `<ProtectedRoute role=...>` + nested routes | "One router; each dashboard is role‑protected; patient sub‑routes are `create`, `tracking`, `coordination`." |
| `frontend/src/config/firebase.js` | `firebaseConfig` from `import.meta.env.VITE_FIREBASE_*` | "Firebase client config comes from Vite env variables only — nothing secret is hard‑coded." |
| `frontend/src/api/client.js` | `baseURL` + the request interceptor | "One Axios instance. Every request carries `Authorization: Bearer <Firebase idToken>`." |
| `frontend/src/pages/patient/CreateBloodRequest.jsx` | `createBloodRequest(bloodRequestToApi(form))` | "The form maps UI labels to API enums and posts to `/api/requests`; success shows `PENDING_VERIFICATION`." |
| `frontend/src/pages/patient/AICoordination.jsx` | `coordinateBloodRequest(requestId)` + the 5 agent cards | "Calls `POST /api/ai/coordinate`; renders `agentStatus`, best donor, and 'Notification: SENT'." |
| `frontend/src/pages/donor/DonorDashboard.jsx` + `components/donor/EmergencyRequestCard.jsx` | `filter(n => n.type === 'MATCH_FOUND')` and the Accept/Decline buttons | "Donor sees `MATCH_FOUND` notifications; Accept calls `POST /api/requests/:id/respond`." |
| `frontend/src/pages/hospital/HospitalRequests.jsx` | `verifyBloodRequest(id)` and `createDonation(...)` | "Verify queue + 'Record Donation' on a `MATCHED` row." |
| `frontend/src/pages/hospital/HospitalDonations.jsx` | `confirmDonation(donationId)` | "Pending‑confirmation table; Confirm triggers inventory + eligibility + FULFILLED." |

### AREFA — BACKEND (open these, in order)

| File | Point at | Say |
|---|---|---|
| `backend/src/app.js` | `app.use("/api/...", ...Routes)` + `helmet` + `cors` | "Express app: security middleware, JSON body, one router mount per feature." |
| `backend/src/middleware/verifyFirebaseToken.js` | `getAuth().verifyIdToken(idToken)` then `User.findOne({firebaseUid})` | "Firebase proves *who*; MongoDB stores *role*. Result: `req.currentUser`." |
| `backend/src/utils/requestStatus.js` | `ALLOWED_TRANSITIONS` + `assertTransition` | "The request lifecycle is a guarded state machine." |
| `backend/src/services/matchingService.js` | the `$geoNear` aggregate + `checkEligibility` loop + `WEIGHTS` | "Geo funnel in the DB, medical rules in Node, urgency‑based scoring." |
| `backend/src/services/aiOrchestrator.js` | `coordinateRealRequest` + the `selectDonors(requestId, { candidateSet: matchingResult })` line | "Facade over 5 agents; **this line is the bug fix** — pass the whole funnel object, not the array." |
| `backend/src/services/responseService.js` | `contactNextDonor` (→ `notifyMatchFound`) and `acceptMatch` | "Creates the real `MATCH_FOUND`; email is best‑effort; first Accept wins." |
| `backend/src/services/donationService.js` | `confirmDonation` (eligibility recalculation + `adjustUnits` + `FULFILLED`) | "The only place eligibility and stock change." |
| `backend/src/services/geminiService.js` | `generateGeminiText` + `model: "gemini-3.6-flash"` | "Adapter over `@google/genai`; key is `GEMINI_API_KEY`, backend only." |

---

## 16. Viva Questions

### ZUBAIR (frontend / integration)
1. **How does the frontend authenticate a request?** Firebase client signs in → get `idToken` → Axios interceptor in `src/api/client.js` sets `Authorization: Bearer <idToken>` → backend `verifyFirebaseToken` verifies it.
2. **Where is the API base URL set?** `src/api/client.js`, `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'`.
3. **How does the patient see FULFILLED without refreshing?** `RequestTracking.jsx` re‑calls `GET /api/requests/:id` every 4 seconds (`setInterval`).
4. **Which page calls the 5‑agent pipeline?** `src/pages/patient/AICoordination.jsx` → `aiApi.coordinateBloodRequest` → `POST /api/ai/coordinate`.
5. **How does the donor's Accept button appear?** `EmergencyRequestCard` shows it only when `expiresAt` exists, is not expired, and the donor has not responded.
6. **What does the donor Accept call?** `POST /api/requests/:id/respond` with `{ response: "ACCEPT" }` (`matchApi.respondToMatch`).
7. **How does the hospital record a donation from the UI?** `HospitalRequests.jsx` "Record Donation" → `POST /api/donations`, then navigates to `/hospital/donations` to Confirm.
8. **Is the map used for matching?** No. `BloodDropMap` (MapLibre + OpenStreetMap) only draws markers; matching is `$geoNear` in MongoDB.
9. **Where does the chatbot send messages?** `POST /api/chat` — no auth, no user data.
10. **Why is there no Gemini/Maps/bKash key in the frontend?** Browser code is public; secret keys stay in `backend/.env` and are never `VITE_` prefixed.

### AREFA (backend / AI)
1. **Firebase decides what, MongoDB decides what?** Firebase decides identity (the verified UID); MongoDB `User.role` decides permissions.
2. **What does `matchingService.findCandidates` return?** `{ requestId, radiusKm, weights, candidates: [{ donorId, distanceKm, etaMinutes, score, ... }] }`, sorted best‑first.
3. **How is "nearby" computed?** A `$geoNear` aggregation on the `2dsphere` index of `DonorProfile.location`, `maxDistance = radiusKm*1000`, `spherical: true`.
4. **What is radius expansion?** If no candidates at the base radius, retry at 2× then 3×, capped at 60 km.
5. **Name the 5 agents and where they live.** AI Manager, Donor Matching, Geo Coordination, Eligibility & Scheduling, Risk & Advisor — `backend/src/agents/*.js`.
6. **Is Gemini one of the 5 agents?** No. Gemini is the chatbot in `services/geminiService.js`; agents are deterministic and never call an LLM.
7. **What was the final bug?** `aiOrchestrator` passed the candidates **array** to `donorMatchingAgent.selectDonors`, which reads `candidateSet.candidates`, so it saw 0 donors → `primary:null`, `contactOrder:[]` → `contactNextDonor()` never ran → no `MATCH_FOUND`.
8. **How was it fixed?** Pass the full funnel object `{ candidateSet: matchingResult }`; add a fallback `contactOrder` from `recommendedDonor + backupDonors`; add an idempotency guard so repeated polling doesn't duplicate notifications.
9. **Who is the `MATCH_FOUND` recipient?** `Notification.user = donor's User._id` (via `notificationService.notifyMatchFound`). It equals `DonorProfile.user`.
10. **Why doesn't email failure block the app notification?** `Notification.create` happens first; `emailService.sendMatchFound` is called after, inside `try/catch`; no SMTP env → `{ sent:false, reason:"not_configured" }`.
11. **Where does eligibility change?** Only in `donationService.confirmDonation` — `nextEligibleAt = calculateNextEligibleAt(component, donatedAt)` per component.
12. **What makes the first Accept win?** `acceptMatch` requires status `MATCHING`; `assignDonor` moves it to `MATCHED`; a second Accept sees `MATCHED` and gets a `409`.

### CSE327 (patterns / testing)
1. **One clear Facade in the code?** `aiOrchestrator.coordinateRealRequest` — one call hides matching + 5 agents + contact.
2. **One clear Adapter?** `geminiService` (wraps `@google/genai`) and `emailService` (wraps `nodemailer`).
3. **One clear Singleton?** Firebase Admin `initializeApp` runs once in `config/firebase.js`; the Gemini client is cached in `getClient()`.
4. **Where is Strategy‑like behaviour?** `matchingService.WEIGHTS[urgency]` and `compatibleDonorGroups` choosing the plasma vs red‑cell table.
5. **Is the status flow the GoF State Pattern?** No — it's a finite state machine implemented as a transition table + `assertTransition` guard, not one class per state.
6. **Is `Notification` an Observer?** No — the frontend **polls** `GET /api/notifications`; there is no subject/observer subscription.
7. **Which patterns should we NOT claim?** Abstract Factory, Builder, Decorator, Observer, formal State, formal Simple Factory.
8. **Difference: unit vs integration vs E2E here?** Unit = `donationRules` compatibility/eligibility; Integration = `aiOrchestratorReal` / `inventoryService` with mocks/DB; E2E = `golden-flow-playwright.js`.
9. **What is AAA?** Arrange the inputs, Act by calling the function once, Assert the result — one behaviour per test.
10. **How many tests pass?** `node --test` full suite: **332 tests passing**; `inventoryService` 24/24; `aiOrchestratorReal` 22/22.

---

## 17. Final Cheat Sheet

**STACK**
React 19 + Vite · React Router · Axios · Firebase Web SDK · MapLibre GL / OpenStreetMap  ·  Node.js + Express · Mongoose · MongoDB Atlas · Firebase Admin SDK · `@google/genai` (Gemini) · Nodemailer · bKash sandbox · `node --test` · Playwright.

**FRONTEND → BACKEND FLOW**
`Component → src/api/*.js → Axios (Bearer token) → Express route → verifyFirebaseToken [→ authorizeRoles] → controller → service → Mongoose → MongoDB → res.json → setState → UI`.

**AUTH FLOW**
`Firebase sign-in → idToken → header → verifyFirebaseToken.getAuth().verifyIdToken → User.findOne({firebaseUid}) → req.currentUser`. Identity = Firebase; role = Mongo.

**GEMINI FLOW**
`Chatbot → POST /api/chat → chatRoutes → chatController.handleChat → geminiService.generateGeminiText → GoogleGenAI.models.generateContent({model:"gemini-3.6-flash"}) → Google → reply`. Key = `GEMINI_API_KEY` (backend `.env` only). No DB, no state change.

**5 AGENTS** (`backend/src/agents/`)
1 AI Manager (`aiManager.coordinate` → `nextAction`) · 2 Donor Matching (`donorMatchingAgent.selectDonors` → primary + `contactOrder`) · 3 Geo Coordination (`geoCoordinationAgent.coordinate` → ETA order) · 4 Eligibility & Scheduling (`eligibilitySchedulingAgent.assessDonors` → now/later/excluded) · 5 Risk & Advisor (`riskAdvisorAgent.analyzeRisk` → risk level). Orchestrated by `aiOrchestrator.coordinateRealRequest` (Facade).

**MATCHING STEPS**
verified request → request coords → `$geoNear` (2dsphere) with DB filter (blood group set + component + `isAvailable`) → `checkEligibility` in Node (deferrals, age, weight) → score = `scoreDistance*w.distance + scoreHistory*w.history` (weights per urgency) → sort → primary + backups → radius 1×/2×/3× (≤ 60 km) if empty.

**DONOR ACCEPT → HOSPITAL → FULFILLED**
`contactNextDonor → Notification{MATCH_FOUND, user: donorId} → donor GET /api/notifications → POST /respond ACCEPT → acceptMatch → MATCHED → hospital POST /api/donations (PENDING) → PATCH /confirm → CONFIRMED → nextEligibleAt +56d, inventory +1 (upsert), unitsFulfilled++ → FULFILLED → patient poll sees FULFILLED`.

**IMPORTANT FILES**
FE: `routes/AppRoutes.jsx`, `config/firebase.js`, `api/client.js`, `pages/patient/CreateBloodRequest.jsx`, `pages/patient/AICoordination.jsx`, `pages/donor/DonorDashboard.jsx`, `pages/hospital/HospitalRequests.jsx`, `pages/hospital/HospitalDonations.jsx`.
BE: `app.js`, `middleware/verifyFirebaseToken.js`, `utils/requestStatus.js`, `utils/donationRules.js`, `services/matchingService.js`, `services/aiOrchestrator.js`, `services/responseService.js`, `services/donationService.js`, `services/inventoryService.js`, `services/geminiService.js`, `agents/*.js`, models `User / DonorProfile / BloodRequest / Notification / Donation / BloodInventory / Deferral`.

**3–4 DESIGN PATTERNS**
Facade → `aiOrchestrator.coordinateRealRequest` · Adapter → `geminiService`, `emailService` · Singleton → `config/firebase.js`, Gemini `getClient()` · Strategy‑like → `matchingService.WEIGHTS[urgency]`, `compatibleDonorGroups` table choice.
NOT used: Abstract Factory, Builder, Decorator, Observer, formal State.

**UNIT TEST EXAMPLES**
`donationRules.test.js` (compatibility, eligibility) · `geoValidation*.test.js` (GeoJSON) · `authorization.test.js` (roles) · `inventoryService.test.js` (upsert, 24/24) · `aiOrchestratorReal.test.js` (agent contract, 22/22). Full suite: **332 passing**. Style = **AAA**.

**GOLDEN FLOW**
`golden-flow-playwright.js` proves: patient create → hospital verify → 5 agents → nearby donor → real `MATCH_FOUND` → donor Accept → hospital Record + Confirm → inventory + eligibility → `FULFILLED`. Screenshots in `test-screenshots/final-working-flow/`.
