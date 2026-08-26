# BloodDrop AI

Blood and blood-component donation coordination platform for Bangladesh.
University project (CSE-327, North South University). AI use is faculty-approved.

## Repository layout

```
Blood_Drop_AI/
├── frontend/     teammate owns this - do not modify
└── backend/      my responsibility
```

**I own the backend only.** Never edit anything under `frontend/` unless I explicitly
ask. The frontend is complete and will be wired to the API later, one module at a time.

## Who does what

| Role | Can do |
|---|---|
| Patient | Create / track / cancel blood requests |
| Donor | Accept or decline requests; profile, eligibility, donation history |
| Hospital | Verify requests before matching; confirm donation completion |
| Volunteer | View and assist emergency requests |
| Admin | Manage users; verify hospitals; view analytics; oversee funding |

Components: **whole blood, plasma, platelets, double red cells.**

## Core flow

1. Patient creates a request
2. Hospital verifies it is legitimate  <- must happen before matching starts
3. Matching finds compatible, eligible, nearby donors
4. Donors are notified in a **wave**, first accept wins, others stood down
5. Donor accepts -> optional volunteer help -> travels to hospital
6. On-site screening at the hospital can still defer the donor
7. Hospital confirms completion -> per-component eligibility recalculated

Failure paths that must be handled: hospital rejects, donor declines, donor never
responds, donor accepts then withdraws, donor no-shows, screening fails, no donor
found after N attempts (request expires).

## Non-negotiable rules

### Blood is never paid for
bKash is for **charitable monetary donations only**. Paying donors for blood is
illegal in Bangladesh. Never build a feature that pays a donor.

### Eligibility is per component, never a single date
A donor does **not** have one `nextEligibleDate`. They have one eligibility record
per component, because the waiting period depends on **(last component -> next
component)**, not just the last donation.

Required: a `donorEligibility` collection with one document per (donor, component),
each holding `eligibleFrom` and a reason code. Recalculate on write - after a
donation completes, and after a deferral is added.

Also required and not in the original roadmap:
- `deferrals` - donor, reasonCode, type (temporary/permanent), startDate, endDate,
  source (self / hospital / admin). On-site screening failure writes one of these.
- `healthDeclarations` - append-only snapshots, never overwritten.
- `donationIntervals` - config: lastComponent, nextComponent, minDays, countryCode.

### Store dateOfBirth, not age
Age goes stale. Derive it when needed.

### Medical decisions are deterministic, never LLM-decided
Blood compatibility, eligibility, and deferrals are hard rules in backend code with
unit tests. Agents call these as services; they never judge them.

### Compatibility direction depends on component
Red cells and plasma run in **opposite directions** (O- is the universal red cell
donor; AB is the universal plasma donor). Key the lookup on component type.

### Use MongoDB's geo index, not hand-rolled Haversine
Donor locations use a `2dsphere` index. Candidate search is a `$geoNear` query that
returns distance-sorted results in one call. Do not fetch all donors and filter in
JavaScript. Google Maps travel time is used later, for **ranking the shortlist only** -
never called per-donor across the whole database.

### Notification waves need deadlines
Donors are notified in waves with a response deadline (2 minutes for emergency,
5 otherwise). Timeouts fire from a background job - never rely on the client being
open. An accepted request also needs an arrival deadline for no-show detection.

### Never expose exact donor location to patients
Patients see approximate distance and ETA only. Precise routing goes to the hospital
and assigned volunteer, and only after the donor accepts. Use privacy-safe DTOs.

## Stack

- Backend: Node.js + Express, MongoDB Atlas + Mongoose
- Auth: **Firebase determines identity, MongoDB determines role.** Backend verifies
  Firebase ID tokens with the Admin SDK. Never trust a role sent from the client.
  Do not mint separate app JWTs.
- AI: Google Gemini, behind a backend `/api/chat` endpoint only
- Maps: Google Directions/Distance Matrix, **server-side only**
- Payments: bKash sandbox
- Email: Nodemailer

## Backend build order

Do one step at a time. Run and manually test each API before starting the next.

1. Express skeleton, health route, error middleware, CORS
2. MongoDB connection
3. Firebase Admin token verification + role authorization middleware
4. User API
5. Donor profile API (apply the per-component eligibility rules above)
6. Blood request CRUD
7. Blood compatibility utilities + unit tests for every blood group
8. Eligibility service + tests
9. Match model and records
10. Accept / decline / timeout workflow
11. Geo queries and distance
12. Radius expansion
13. Donation completion -> eligibility recalculation
14. Notifications
15. Email
16. Volunteer API
17. Admin API and analytics (calculate dynamically, don't persist a giant doc)
18. Five agents: aiManager, donorMatching, eligibilityScheduling, geoCoordination,
    riskAdvisor. Agents wrap the already-tested services, never duplicate the rules.
19. Gemini `/api/chat`
20. Maps data contract with privacy-safe DTOs
21. Funding records
22. bKash sandbox (last)
23. Security audit
24. Tests

Do not build the agents before requests, donors, matching, eligibility and location
services all work.

## Code comments

I know C, C++, and Java but not JavaScript. Write for a reader who understands
programming but not this ecosystem.

- Explain JS idioms inline the first few times: async/await, promises, destructuring,
  arrow functions, .map/.filter/.reduce, spread syntax.
- Short comment above every function: what it does, takes, returns.
- Comment the *why* on non-obvious logic.
- Prefer clear, boring code over clever one-liners.

## Conventions

- All secrets in `backend/.env`, never in source. Keep `.env.example` updated.
- Gemini, Maps, and bKash keys must never reach browser code. Never `VITE_` prefixed.
- Every role-restricted endpoint checks the role server-side.
- Validate every request body server-side. Frontend validation is not security.
- The support chatbot gets read-only tools scoped to the requesting user's own ID and
  role. It must refuse medical advice and redirect health questions to the hospital.
- Commit in small pieces with descriptive messages.

## Current status

Frontend complete and merged. Backend not started. Working on branch `Arefa`.