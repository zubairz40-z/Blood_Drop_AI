# BloodDrop AI — Viva / Report Document
**CSE 327: Software Design & Architecture**
North South University | Supervised by Zubair

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend (React + Vite)](#2-frontend)
3. [Gemini AI Integration](#3-gemini-ai-integration)
4. [Backend (Express + MongoDB)](#4-backend)
5. [Matching Algorithm](#5-matching-algorithm)
6. [AI Agents (5 Agents)](#6-ai-agents)
7. [Donor Lifecycle & State Machine](#7-donor-lifecycle)
8. [Design Patterns](#8-design-patterns)
9. [SOLID & Design Principles](#9-solid-principles)
10. [Unit Testing](#10-unit-testing)
11. [Feature Table](#11-feature-table)
12. [Viva Questions & Answers](#12-viva-questions)
13. [Cheat Sheet](#13-cheat-sheet)

---

## 1. Architecture Overview

BloodDrop AI is a full-stack blood-donation coordination platform built for Bangladesh. It matches patients who need blood with eligible, compatible, nearby donors — verified by hospitals in real time.

### High-Level Diagram (Logical)

```
┌────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                         │
│  React 19 + Vite 8 + Tailwind 4 + DaisyUI 5 + Leaflet    │
│  Firebase Auth (email/password)                            │
│  Gemini Chat widget (floating, role-gated)                 │
└──────────────────────┬─────────────────────────────────────┘
                       │ REST (JSON) + Firebase Bearer token
                       ▼
┌────────────────────────────────────────────────────────────┐
│                      SERVER LAYER                          │
│  Express 5  ·  verifyFirebaseToken  ·  authorizeRoles      │
│                                                            │
│  14 route modules                                          │
│  12 controllers   14 services   5 AI agents                │
│  Nodemailer (lazy SMTP)  ·  Google Maps (server-only)      │
│  bKash sandbox (pay-later)                                 │
└──────────────────────┬─────────────────────────────────────┘
                       │ Mongoose 9
                       ▼
┌────────────────────────────────────────────────────────────┐
│                       DATA LAYER                           │
│  MongoDB Atlas  ·  11 collections  ·  2dsphere geo index   │
└────────────────────────────────────────────────────────────┘
```

### Request Lifecycle (happy path)

```
Patient creates request
  → Hospital verifies legitimacy
    → AI Manager coordinates + ranks candidates
      → Matching service finds compatible, eligible, nearby donors
        → Notification wave sent (2 min / 5 min deadline)
          → First eligible donor accepts (browser)
            → Travel to hospital → On-site screening
              → Hospital confirms donation
                → Donation recorded → Eligibility recalculated per component
```

### Key Non-Negotiable Rules

| Rule | Implementation |
|---|---|
| Blood is never paid for | bKash only for charitable donations, no donor payment anywhere |
| Eligibility is per-component | `DonorProfile` holds one eligibility entry per component type |
| Medical decisions are deterministic | Blood compatibility, eligibility, deferral: hard-coded JS — never LLM |
| Donor location is private | Patients see distance/ETA only; exact coordinates returned to hospital + volunteer only |
| Geo queries use MongoDB native | `2dsphere` index + `$geoNear` — no hand-rolled Haversine |
| Notification waves have deadlines | Background sweep job; EMERGENCY=2min, ROUTINE/URGENT=5min |
| Date of birth, not age | `dateOfBirth` stored; age derived on demand |

---

## 2. Frontend

**Stack**: React 19 · Vite 8 · Tailwind 4 · DaisyUI 5 · Lucide React · Framer Motion · Leaflet · Axios

### Directory Layout

```
frontend/
  src/
    api/          # 12 API modules (Axios + Bearer interceptor)
    components/   # Reusable UI (Maps, Charts, AI, Donor, Common)
    config/       # Firebase init (VITE_FIREBASE_* env vars)
    context/      # AuthContext — Firebase onAuthStateChanged + /api/auth/me
    hooks/        # useDonorProfile, useDocumentTitle, useLocation
    pages/        # 8 role-based directories (admin, donor, hospital, patient, volunteer, shared, auth, landing)
    routes/       # AppRoutes.jsx — 30+ routes, ProtectedRoute role gates
    utils/        # dateUtils, locationUtils, validationUtils, currencyUtils, bloodGroupUtils, donorStatusUtils, errorUtils
    App.jsx       # Root: AuthProvider + router + ChatWidget
```

### Auth Flow

```
1. Firebase signInWithEmailAndPassword  →  Firebase ID token
2. AuthContext stores token in localStorage
3. Axios interceptor attaches `Authorization: Bearer <token>` to every request
4. Backend verifyFirebaseToken middleware calls admin.auth().verifyIdToken()
5. Backend checks MongoDB for the user document → sets req.currentUser + role
6. authorizeRoles('hospital') etc. blocks unauthorized access
```

Frontend never stores or sends roles — all role authorization is server-side.

### Route Protection

Every protected route wraps in:
```jsx
<ProtectedRoute allowedRoles={['hospital']}>
  <HospitalRequests />
</ProtectedRoute>
```

This checks the role from `useAuth()` context, which is fetched from the backend `/api/auth/me` endpoint on mount.

---

## 3. Gemini AI Integration

### Configuration

| Field | Value |
|---|---|
| Backend model | `gemini-3.6-flash` (hardcoded in `geminiService.js`) |
| SDK | `@google/genai` v2.19 |
| Endpoint | `POST /api/chat` |
| Auth | Firebase ID token → `req.currentUser` |
| Tool | `getSupportInfo` — returns static platform usage guidance |

### Backend Flow (`chatController.js` → `geminiService.js`)

```js
// Lazy initialization — first chat call creates the client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-3.6-flash',
  contents: messages,          // [{ role:'user', parts:'...' }, ...]
  config: { tools: [getSupportInfo] }
});
```

The system prompt is role-aware and cached per-role in memory:
- Patient system prompt includes guidance on creating requests, understanding eligibility, and what the platform can do
- Donor system prompt includes eligibility guidance, donation history, and declining responsibilities
- Hospital system prompt includes verification workflows and request management
- Admin system prompt includes user management, analytics overview, and system health
- General users get a shorter general BloodDrop introduction

### Frontend Chat Widget (`ChatWidget.jsx`)

- Floating button (bottom-right, HeartPulse icon) — only shown on authenticated routes
- Collapsible chat panel with message history
- Sends `{ message, history }` to `/api/chat`
- Typing indicator while awaiting response
- State persisted in `useState` — lost on page refresh (by design for this scope)

### Tool Calling (Extensible Design)

The chat system is designed for future expansion:
- `getSupportInfo` tool provides static platform guidance
- Architecture allows adding more tools: donor eligibility lookup, request status, notification status
- System prompts are built from templates; new roles require only a new template entry

---

## 4. Backend

**Stack**: Express 5 · Mongoose 9 · Firebase Admin 14 · Nodemailer · Google Maps API · bKash sandbox

### Route Structure

```
backend/src/
  app.js                          # Express app setup, middleware, 14 route mounts
  server.js                       # Entry point: dotenv, DB connect, start
  routes/
    authRoutes.js                  # POST /register, GET /me, PUT /me, POST /logout
    donorRoutes.js                 # GET /, GET /search, GET /stats, POST /
    donorProfileRoutes.js          # GET /, PUT /, POST /deactivate, GET /eligibility
    requestRoutes.js               # Full CRUD + /verify + /match + /respond
    donationRoutes.js              # POST /record, PUT /:id/confirm, PUT /:id/cancel
    adminRoutes.js                 # /users, /hospitals, /analytics, /payments, /system-health, /smoketest, /cleanup-db
    hospitalRoutes.js              # /, /:id/blood-inventory
    bloodInventoryRoutes.js        # GET /:hospitalId, POST /update
    notificationRoutes.js          # GET /my, PUT /:id/read
    volunteerRoutes.js             # GET /, GET /my-tasks, PUT /:id/status
    chatRoutes.js                  # POST /
    mapsRoutes.js                  # POST /distance, POST /eta
    paymentRoutes.js               # POST /init, GET /status/:id, POST /simulate-webhook
    deferralRoutes.js              # GET /, POST /, GET /donor/:donorId
    healthDeclarationRoutes.js     # GET /donor/:donorId, POST /
    eligibilityRoutes.js           # GET /donor/:donorId, GET /config, POST /config
    donationIntervalsRoutes.js     # GET /, GET /donor/:donorId
    reportsRoutes.js               # GET /comprehensive
    rulesRoutes.js                 # GET /compatibility/:component, GET /donation-intervals
    coordinatorRoutes.js           # POST /start-matching/:requestId
```

### Middleware Chain

```
verifyFirebaseToken  →  authorizeRoles(...roles)  →  controller  →  errorHandler
```

- `verifyFirebaseToken`: Extracts Bearer token → `admin.auth().verifyIdToken()` → finds/creates MongoDB user → sets `req.currentUser`
- `authorizeRoles`: Checks `req.currentUser.role` against allowed roles
- `errorHandler`: Catches all thrown errors, returns `{ success: false, error: message }`

### Key Services

| Service | Purpose | Key Methods |
|---|---|---|
| `requestService` | CRUD + status transitions for BloodRequest | `createRequest`, `updateRequestStatus`, `getRequestById` |
| `matchingService` | Geo-based donor matching | `findCandidates` ($geoNear), `scoreCandidate`, `beginMatching` |
| `responseService` | Donor accept/decline + wave sweep | `contactNextDonor`, `acceptMatch`, `declineMatch`, `sweepExpired` |
| `donationService` | Record/confirm/cancel donations | `recordDonation`, `confirmDonation`, `cancelDonation` |
| `eligibilityService` | Per-component eligibility logic | `checkEligibility`, `recalculateAllEligibility` |
| `notificationService` | Create + notify (in-app) | `notifyMatchFound`, `createNotification` |
| `emailService` | Nodemailer wrapper | `sendMail`, `sendMatchNotification`, `sendDonationReminder` |
| `geminiService` | Gemini chat | `generateChatResponse` (lazy init) |
| `routeService` | Google Maps API | `getDistanceMatrix`, `getDirections` |
| `bkashService` | bKash sandbox | `createPayment`, `executePayment` |

### MongoDB Collections

| Collection | Purpose |
|---|---|
| `users` | firebaseUid, email, role, bloodGroup, dateOfBirth, location, hospitalId |
| `donorprofiles` | userId, isAvailable, location (2dsphere), per-component eligibility array |
| `bloodrequests` | requester, component, urgency, status, location, matchedDonor, contactOrder |
| `notifications` | userId, requestId, type, message, expiresAt, wave |
| `donations` | donorId, requesterId, hospitalId, component, status, completedAt |
| `bloodinventories` | hospitalId, component, bloodGroup, unitsAvailable |
| `deferrals` | donorId, reasonCode, type (temporary/permanent), startDate, endDate |
| `healthdeclarations` | donorId, snapshot data (append-only) |
| `volunteertasks` | volunteerId, requestId, status |
| `payments` | payerId, amount, bkashTrxId, status |
| `donationintervalconfigs` | lastComponent, nextComponent, minDays, countryCode |

---

## 5. Matching Algorithm

Located in `matchingService.js`.

### Step 1: Candidate Discovery (`findCandidates`)

```js
// MongoDB $geoNear — single query, distance-sorted, uses 2dsphere index
const candidates = await DonorProfile.aggregate([
  { $geoNear: {
      near: { type: 'Point', coordinates: requestLocation },
      distanceField: 'distanceMeters',
      maxDistance: radiusMeters,
      query: { isAvailable: true },
      spherical: true
  }}
]);
```

### Step 2: Score Each Candidate (`scoreCandidate`)

Weights (total 100):

| Factor | Weight | Logic |
|---|---|---|
| Blood compatibility | 40 | Perfect match → 40; compatible → 20–30; incompatible → 0 |
| Distance | 25 | Scaled inversely with maxDistance; closer = higher |
| Eligibility | 20 | Already eligible → 20; temporarily deferred (≤30 days) → 10; permanently deferred → 0 |
| Donation history | 15 | Recent donors (≤90 days) get reduced score; older donors get full 15 |

Blood compatibility uses the `BLOOD_COMPATIBILITY` map from `donationRules.js`:
```js
// O- is universal red cell donor; AB is universal plasma donor
const BLOOD_COMPATIBILITY = {
  whole_blood: { 'A+': ['A+','A-','O+','O-'], 'O-': ['O-'], ... },
  plasma:      { 'AB+': ['A+','B+','AB+','O+','O-'], ... },  // opposite direction
  ...
};
```

### Step 3: Rank and Select (`beginMatching`)

```js
scored.sort((a, b) => b.score - a.score);  // highest score first
const primary = scored[0];
const backups = scored.slice(1, 4);        // top 3 backup donors
```

### Step 4: Contact Wave

`responseService.contactNextDonor()` sends the primary donor a notification with an expiry window (2 min emergency / 5 min otherwise). If no response → `sweepExpired()` moves to backup donors.

---

## 6. AI Agents (5 Agents)

All agents live in `backend/src/agents/`. They are **stateless functions** — no LLM calls; they wrap deterministic services. The AI Manager orchestrates them.

### Agent 1: AI Manager (`aiManager.js`)

```
coordinate(request, candidates)
  → calls: donorMatchingAgent.selectDonors()
           eligibilitySchedulingAgent.assessDonors()
           geoCoordinationAgent.coordinate()
           riskAdvisorAgent.analyzeRisk()
  → returns: { recommendation, reasoning, nextAction, selectedDonor, backups }
```

The `nextAction` is a state machine decision:
- `VERIFIED` + candidates found → `START_MATCHING`
- `MATCHING` + all contacted, no response → `FOLLOW_UP`
- `MATCHING` + primary accepted → `CONFIRM_DONATION`
- Any risk > 0.7 → `ESCALATE_TO_ADMIN`

### Agent 2: Donor Matching Agent (`donorMatchingAgent.js`)

```js
selectDonors(candidates)
  // Pure sort by score descending; returns { primary, backups }
```

### Agent 3: Eligibility Scheduling Agent (`eligibilitySchedulingAgent.js`)

```js
assessDonors(candidates)
  // For each candidate: calls eligibilityService.checkEligibility(component)
  // Returns per-donor eligibility status + next eligible date
```

### Agent 4: Geo Coordination Agent (`geoCoordinationAgent.js`)

```js
coordinate(candidates, requestLocation)
  // Re-ranks by distance; returns distance-sorted list with distance info
  // Does NOT call Google Maps API (that's routeService, used only for final ranking)
```

### Agent 5: Risk Advisor Agent (`riskAdvisorAgent.js`)

```js
analyzeRisk(request, donors)
  // Returns { overallRisk, factors[], mitigation }
  // Factors: no-show probability, distance risk, eligibility confidence
```

### Agent Architecture Diagram

```
         ┌──────────────────────────────┐
         │       AI Manager             │
         │  (orchestrator / final rec)  │
         └─────┬────┬────┬────┬─────────┘
               │    │    │    │
     ┌─────────┘    │    │    └─────────┐
     ▼              ▼    ▼              ▼
  DonorMatching  Eligibility  GeoCoord  RiskAdvisor
  (sort by score) (check)     (sort by dist) (assess risk)
```

All agents are pure functions — no side effects, no DB writes, no LLM calls. The AI Manager is the only one that produces the final `nextAction` that the controller acts on.

---

## 7. Donor Lifecycle

### Request Status State Machine

```
                ┌─────────────┐
                │   DRAFT     │  (optional, if supported)
                └──────┬──────┘
                       │ createRequest()
                       ▼
                ┌─────────────────┐
                │PENDING_VERIFIC. │  Patient submitted, waiting for hospital
                └──────┬──────────┘
                       │ verifyRequest()
                       ▼
                ┌──────────┐
                │ VERIFIED │  Hospital confirmed legitimacy
                └────┬─────┘
                     │ startMatching()
                     ▼
                ┌──────────┐
                │ MATCHING │  Contacting donors in waves
                └──┬───┬───┘
        accept() ──┘   └── expire() / cancel()
           ▼                    ▼
    ┌──────────┐         ┌──────────┐
    │ MATCHED  │         │ EXPIRED  │  No donor responded in time
    └────┬─────┘         └──────────┘
         │ confirmDonation()
         ▼
    ┌──────────┐
    │FULFILLED │  Hospital confirmed donation completed
    └──────────┘
```

**Invalid transitions** throw an error (enforced by `requestStatus.js` `assertTransition`).

### Donation Status

```
PENDING → CONFIRMED (hospital confirms on-site screening + donation)
PENDING → CANCELLED (donor no-show or screening failure)
```

### Per-Component Eligibility Recalculation

When a donation completes (`confirmDonation`), `eligibilityService.recalculateAllEligibility()` runs:

```
For each component in COMPONENT_CODES:
  Check donationIntervals config: lastComponent → nextComponent → minDays
  Set DonorProfile eligibility[component].eligibleFrom = donationDate + minDays
```

This means a donor who just gave whole blood may still be eligible for platelets (shorter wait), but not for another whole blood donation.

---

## 8. Design Patterns

### 1. **MVC (Model-View-Controller)**

The entire backend follows MVC:
- **Model**: Mongoose schemas in `models/` (User, DonorProfile, BloodRequest, etc.)
- **View**: JSON responses (no server-side rendering)
- **Controller**: `controllers/` — handles HTTP, delegates to services

### 2. **Service Layer**

All business logic lives in `services/`, not controllers. Controllers are thin:
```js
// requestController.js — thin controller
exports.verifyRequest = async (req, res, next) => {
  const result = await requestService.verifyRequest(req.params.id, req.currentUser._id);
  res.json({ success: true, data: result });
};
```

### 3. **Agent Pattern (Orchestrator + Specialists)**

`aiManager.js` orchestrates four specialist agents. Each specialist does one thing. The manager calls them all and produces a composite recommendation. This is a **Facade + Chain of Responsibility** hybrid.

### 4. **Middleware Chain**

Express middleware provides a pipeline pattern:
```
Request → verifyFirebaseToken → authorizeRoles → controller → errorHandler → Response
```

Cross-cutting concerns (auth, role checking, error handling) are separated from business logic.

### 5. **Lazy Initialization**

Both `geminiService.js` and `emailService.js` initialize their clients on first use, not at import time. This avoids failing at startup if credentials are missing (useful in dev).

### 6. **Observer / Notification Pattern**

`notificationService.js` is called after state changes (request verified, donation completed, match found). It acts as a side-effect handler — the caller doesn't need to know about notification logic.

### 7. **State Machine Pattern**

`requestStatus.js` enforces valid status transitions. Every status change goes through `assertTransition(from, to)` which throws on invalid transitions. This prevents the system from entering illegal states (e.g., jumping from DRAFT to FULFILLED).

---

## 9. SOLID & Design Principles

### Single Responsibility (S)
- Each service does one thing: `matchingService` only matches; `eligibilityService` only checks eligibility
- Each agent does one thing: `riskAdvisorAgent` only assesses risk; it doesn't match or notify

### Open/Closed (O)
- New blood components can be added by extending `COMPONENT_CODES` in `donationRules.js`
- New agent types can be added without modifying existing agents (the manager calls them in sequence)

### Liskov Substitution (L)
- Not heavily applicable (no class inheritance hierarchy), but all services follow the same pattern: export async functions that take params and return results

### Interface Segregation (I)
- API responses are shaped per-role: donors see eligible requests only; hospitals see requests in their facility
- Frontend API modules are split by domain: `requestApi.js`, `donorApi.js`, `chatApi.js`

### Dependency Inversion (D)
- Controllers depend on service abstractions (functions), not concrete implementations
- Gemini, Nodemailer, and Google Maps are wrapped in services — the rest of the code doesn't import them directly

### Additional Principles
- **DRY**: `donationRules.js` centralizes all compatibility logic; reused by matching, eligibility, and agents
- **Separation of Concerns**: Auth, validation, business logic, and data access are in separate layers
- **Fail-Safe Defaults**: Unauthorized requests are rejected; invalid status transitions throw; missing env vars cause graceful degradation (email shows "Not configured")
- **Defense in Depth**: Frontend validation + backend `express-validator` + MongoDB schema validation

---

## 10. Unit Testing

### Stack

- **Test framework**: Jest 30 + Supertest 7 (HTTP assertions)
- **Coverage target**: aiOrchestrator agent logic (16 tests, all passing)
- **Run**: `cd backend && npx jest --coverage`

### Test Categories

| Category | Files | Status |
|---|---|---|
| Agent logic (aiOrchestrator) | `__tests__/unit/agents/aiOrchestrator.test.js` | ✅ 16/16 passing |
| Integration (E2E golden flow) | `golden-flow-test.js` (Playwright) | ✅ All steps passing |
| Route tests (DB-dependent) | `__tests__/integration/routes/` | ⚠️ Timeout in CI (pre-existing, needs Atlas fix) |
| Controller tests | `__tests__/unit/controllers/` | ⚠️ Timeout in CI (pre-existing) |

### Example Test: AI Orchestrator

```js
describe('AI Orchestrator', () => {
  it('should recommend START_MATCHING when request is VERIFIED and candidates exist', async () => {
    const result = await coordinate(mockRequest, mockCandidates);
    expect(result.nextAction).toBe('START_MATCHING');
  });

  it('should recommend FOLLOW_UP when all donors have been contacted', async () => {
    // mockRequest.contactOrder = ['donor1', 'donor2']
    const result = await coordinate(mockRequest, []);
    expect(result.nextAction).toBe('FOLLOW_UP');
  });
});
```

### Golden Flow Test (Playwright)

The E2E test (`golden-flow-test.js`) automates the full happy path:
1. Patient logs in → creates a blood request
2. Hospital logs in → verifies the request
3. AI coordinator runs → donors are matched
4. Donor gets notified → accepts in browser
5. Hospital confirms donation → status becomes FULFILLED
6. Cleanup deletes test data + resets donor eligibility

---

## 11. Feature Table

| Feature | Status | Notes |
|---|---|---|
| Patient request creation | ✅ | Form with geolocation, component picker, urgency |
| Hospital verification | ✅ | Verify/reject with reason |
| AI-powered matching | ✅ | 5 agents, deterministic scoring |
| Donor notification waves | ✅ | EMERGENCY=2min, ROUTINE=5min |
| Donor accept/decline (browser) | ✅ | Accept/decline buttons with response deadline |
| Donation confirmation | ✅ | Hospital confirms completion |
| Eligibility recalculation | ✅ | Per-component, per-donation-interval |
| Firebase authentication | ✅ | Email/password, role-gated |
| Role-based authorization | ✅ | Server-side middleware |
| Geo-based matching | ✅ | MongoDB 2dsphere + $geoNear |
| Blood compatibility engine | ✅ | Component-specific (RBC vs plasma directions) |
| Deferral management | ✅ | Temporary + permanent, hospital/admin/self |
| Health declarations | ✅ | Append-only snapshots |
| Donation history | ✅ | Donor sees all past donations |
| Admin dashboard | ✅ | Users, analytics, system health, payments |
| Volunteer task management | ✅ | Assign/track volunteers |
| bKash sandbox payment | ✅ | Init + execute + webhook simulation |
| Email notifications | ✅ | Nodemailer, lazy SMTP init |
| Gemini AI chatbot | ✅ | Role-aware system prompt, tool calling |
| Maps integration | ✅ | Distance matrix + directions (server-side) |
| Blood inventory management | ✅ | Per-hospital, per-component, per-group |
| Reports endpoint | ✅ | Comprehensive analytics data |
| Eligibility config API | ✅ | Dynamic donation intervals per component |
| Rules lookup API | ✅ | Blood compatibility + donation intervals |

---

## 12. Viva Questions & Answers

### General

**Q: What is BloodDrop AI?**
A: A full-stack blood-donation coordination platform for Bangladesh that matches patients needing blood with eligible, compatible, nearby donors, verified by hospitals in real time.

**Q: What tech stack did you use?**
A: React 19 + Vite 8 + Tailwind 4 + DaisyUI 5 (frontend), Express 5 + Mongoose 9 + Firebase Admin 14 (backend), MongoDB Atlas (database), Google Gemini (AI), Google Maps API (geo).

**Q: Why did you choose this stack?**
A: React is the industry standard for SPAs. Express is lightweight and flexible for REST APIs. MongoDB's native 2dsphere index supports geospatial queries without external services. Firebase handles auth reliably so we can focus on domain logic.

---

### Architecture

**Q: Explain the MVC pattern in your backend.**
A: Models are Mongoose schemas (`models/`), Controllers handle HTTP request/response (`controllers/`), and Services contain all business logic (`services/`). Controllers are thin — they validate input, call a service, and return JSON.

**Q: Why a service layer separate from controllers?**
A: Separation of concerns. Services are reusable (called by agents, controllers, and tests). Controllers handle only HTTP concerns (parsing, status codes, error responses).

**Q: How does the middleware chain work?**
A: Every request passes through `verifyFirebaseToken` (extracts and validates the Firebase ID token, attaches `req.currentUser`), then `authorizeRoles` (checks `req.currentUser.role` against allowed roles), then the controller. Errors are caught by `errorHandler` at the end.

---

### AI & Agents

**Q: What AI model does BloodDrop use?**
A: Google Gemini `gemini-3.6-flash`, called via the `@google/genai` SDK through a backend proxy endpoint (`POST /api/chat`). The frontend never calls Gemini directly.

**Q: Why use Gemini?**
A: Faculty requirement for the CSE 327 project to integrate AI. Gemini Flash is fast and free-tier friendly.

**Q: Explain the 5 AI agents.**
A:
1. **AI Manager**: Orchestrator — calls the other four agents, aggregates results, produces a final recommendation
2. **Donor Matching**: Sorts candidates by compatibility score
3. **Eligibility Scheduling**: Checks per-component eligibility for each candidate
4. **Geo Coordination**: Ranks candidates by distance
5. **Risk Advisor**: Assesses operational risk factors (no-show probability, distance, eligibility confidence)

**Q: Are the agents LLM-based?**
A: No. All five agents are **deterministic functions** — pure JavaScript with no LLM calls. They wrap tested services (`matchingService`, `eligibilityService`, etc.). The AI Manager is the only agent that produces a `nextAction` decision, and it's rule-based. This is by design: medical and operational decisions must be reproducible and testable.

**Q: Why not use LLM for medical decisions?**
A: Blood compatibility and eligibility are hard, well-defined rules. Using an LLM would introduce non-determinism, hallucination risk, and regulatory concerns. The LLM is only used for the support chatbot, which provides general platform guidance — never medical advice.

**Q: How does the chatbot avoid giving medical advice?**
A: The system prompt explicitly instructs the model to refuse health questions and redirect to the hospital. The `getSupportInfo` tool returns only static platform usage guidance. No patient-specific data is sent to the LLM.

---

### Matching Algorithm

**Q: How does the matching algorithm work?**
A: Three steps:
1. **Discovery**: MongoDB `$geoNear` query finds all available donors within the configured radius, sorted by distance
2. **Scoring**: Each candidate is scored on four factors — blood compatibility (40%), distance (25%), eligibility status (20%), donation history (15%)
3. **Selection**: Top scorer becomes the primary contact; next 3 are backups

**Q: Why use MongoDB's `$geoNear` instead of Haversine in JavaScript?**
A: `$geoNear` runs on the database server using a `2dsphere` index. It returns distance-sorted results in one query. Haversine in JS would require fetching all donors first (potentially thousands), then filtering client-side — much slower and more memory-intensive.

**Q: How does blood compatibility differ for plasma vs red cells?**
A: They run in opposite directions. For red cells (whole blood, packed RBC, double red cells), O- is the universal donor. For plasma, AB is the universal donor. The compatibility map is keyed on component type in `donationRules.js`.

**Q: What happens if the primary donor doesn't respond?**
A: `responseService.sweepExpired()` runs on a background schedule. When a notification expires (2 min for emergency, 5 min otherwise), the next backup donor is contacted automatically. This continues until a donor accepts or all candidates are exhausted.

---

### Eligibility

**Q: Why is eligibility per-component, not a single date?**
A: Different blood components have different waiting periods. After donating whole blood, a donor may still be eligible for platelets (shorter wait). A single `nextEligibleDate` would be incorrect — it would either be too conservative (blocking valid donations) or too permissive (allowing unsafe ones).

**Q: How is eligibility recalculated?**
A: After every confirmed donation, `eligibilityService.recalculateAllEligibility()` runs. It checks the `donationIntervals` config for the last component → next component pair and sets `eligibleFrom = donationDate + minDays`.

---

### Database

**Q: Why MongoDB over PostgreSQL?**
A: MongoDB's native geospatial support (`2dsphere` index, `$geoNear`) is critical for distance-based donor matching. The document model also fits our flexible schema (different donor profiles, varying request metadata). For a university project, MongoDB Atlas's free tier and schema flexibility were practical advantages.

**Q: What is a 2dsphere index?**
A: MongoDB's index for geospatial queries on spherical geometry (Earth). It supports `$geoNear`, `$near`, and `$within` queries. Our `donorprofiles` collection has a `2dsphere` index on `location`, which is a GeoJSON Point with `[longitude, latitude]` coordinates.

**Q: How do you handle data consistency without foreign keys?**
A: Mongoose references (like `requester: ObjectId` in BloodRequest) act as logical foreign keys. Referential integrity is enforced in application code (services validate that referenced documents exist before performing operations).

---

### Security

**Q: How does authentication work?**
A: Firebase handles identity. The frontend calls `signInWithEmailAndPassword`, gets a Firebase ID token, and attaches it as a `Bearer` token in the `Authorization` header. The backend's `verifyFirebaseToken` middleware calls `admin.auth().verifyIdToken()` to validate it, then looks up the corresponding MongoDB user.

**Q: How does role authorization work?**
A: Server-side only. The frontend never sends role information. After Firebase authentication, the backend looks up the user's role in MongoDB. `authorizeRoles('hospital')` middleware blocks requests from users with other roles.

**Q: Is the Gemini API key exposed to the frontend?**
A: No. It's only in `backend/.env`. The frontend calls `POST /api/chat` (our backend endpoint), which forwards to Gemini server-side. No `VITE_` prefix on the key.

**Q: Is donor location exposed to patients?**
A: No. Patients see approximate distance and ETA only. Precise routing (coordinates, directions) is shared only with the hospital and assigned volunteer, and only after the donor accepts.

---

### Frontend

**Q: How does the chatbot work?**
A: A floating `ChatWidget.jsx` component renders a collapsible panel. It sends `{ message, history }` to `POST /api/chat`. The backend appends a role-aware system prompt based on the user's role, then calls Gemini. The response is streamed back as JSON and displayed in the chat panel.

**Q: How are routes protected?**
A: `AppRoutes.jsx` wraps each protected route in `<ProtectedRoute allowedRoles={[...]}>`. This component checks `useAuth()` for the user's role. If the role isn't in `allowedRoles`, it redirects to the home page.

**Q: What is the AuthContext?**
A: `AuthContext.jsx` wraps the app and provides `user`, `token`, and `loading` to all components. On mount, it listens to Firebase's `onAuthStateChanged`. When a Firebase user is detected, it calls `GET /api/auth/me` to get the MongoDB user profile (including role). This is the source of truth for the frontend.

---

## 13. Cheat Sheet

### Quick Command Reference

```bash
# Backend
cd backend
npm run dev          # Start dev server (port 5001)
npx jest --coverage  # Run unit tests

# Frontend
cd frontend
npm run dev          # Start dev server (port 5173)
npm run build        # Production build (3.46s)

# Golden Flow Test
node golden-flow-test.js    # Playwright E2E test
node cleanup-test-data.js   # Clean test data before run
```

### Key URLs

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5001/api` |
| Chat endpoint | `POST /api/chat` |
| Matching start | `POST /api/coordinator/start-matching/:requestId` |

### Key Files to Know

| File | Purpose |
|---|---|
| `backend/src/app.js` | Express app setup, all route mounts |
| `backend/src/services/matchingService.js` | Core matching algorithm |
| `backend/src/services/responseService.js` | Donor notification + accept/decline |
| `backend/src/agents/aiManager.js` | Orchestrator — calls 4 agents |
| `backend/src/utils/donationRules.js` | Blood compatibility map |
| `backend/src/utils/requestStatus.js` | Status state machine |
| `backend/src/middleware/verifyFirebaseToken.js` | Auth middleware |
| `frontend/src/context/AuthContext.jsx` | Firebase + role state |
| `frontend/src/pages/patient/CreateRequest.jsx` | Request creation form |
| `frontend/src/pages/donor/DonorDashboard.jsx` | Donor notification list |
| `frontend/src/pages/hospital/HospitalRequests.jsx` | Verify + match + confirm |

### Demo Accounts

| Role | Email | Password |
|---|---|---|
| Patient | `patient.demo@blooddrop.test` | `patient1234` |
| Hospital (Square) | `square.hospital@blooddrop.test` | `square1234` |
| Donor | `square.donor@blooddrop.test` | `donor1234` |

### Status Flow Summary

```
Patient creates → PENDING_VERIFICATION → Hospital verifies → VERIFIED
→ AI coordinates + matching starts → MATCHING → Donor accepts → MATCHED
→ Hospital confirms → FULFILLED
```
