/**
 * golden-flow-api.js — drives the whole request lifecycle through the REAL
 * HTTP API with real Firebase tokens, then verifies persisted DB state.
 *
 * Proves the fix: AI coordination must create a MATCH_FOUND for the selected
 * donor and the flow must reach FULFILLED without any manual DB status edit.
 *
 * Usage: cd backend && node scripts/golden-flow-api.js
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const User = require("../src/models/User");
const DonorProfile = require("../src/models/DonorProfile");
const Notification = require("../src/models/Notification");
const BloodRequest = require("../src/models/BloodRequest");
const BloodInventory = require("../src/models/BloodInventory");
const Donation = require("../src/models/Donation");

const API = "http://localhost:5000";
const FB_KEY = process.env.FIREBASE_WEB_API_KEY;

const PATIENT = { email: "patient.demo@blooddrop.test", password: "patient1234" };
const HOSPITAL = { email: "square.hospital@blooddrop.test", password: "square1234" };
const PRIMARY_DONOR = { email: "square.donor@blooddrop.test", password: "donor1234" };
const WRONG_DONOR = { email: "united.donor@blooddrop.test", password: "donor1234" };

const pass = [];
const fail = [];
function check(name, cond, extra = "") {
  (cond ? pass : fail).push(name + (extra ? `  (${extra})` : ""));
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  -> ${extra}` : ""}`);
}

async function fbToken({ email, password }) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FB_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) }
  );
  const d = await r.json();
  if (!d.idToken) throw new Error(`Firebase auth failed for ${email}: ${d.error?.message}`);
  return d.idToken;
}

async function api(method, path, token, body) {
  const opts = { method, headers: { Authorization: `Bearer ${token}` } };
  if (body) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
  const res = await fetch(`${API}${path}`, opts);
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, json };
}

async function main() {
  await connectDB();

  const [patientTok, hospitalTok, donorTok, wrongTok] = await Promise.all([
    fbToken(PATIENT), fbToken(HOSPITAL), fbToken(PRIMARY_DONOR), fbToken(WRONG_DONOR),
  ]);
  console.log("tokens acquired\n");

  const hospMe = await api("GET", "/api/auth/me", hospitalTok);
  const hospitalId = hospMe.json?.user?._id;
  const donorMe = await api("GET", "/api/auth/me", donorTok);
  const donorUserId = donorMe.json?.user?._id;
  console.log("hospitalId", hospitalId, "donorUserId", donorUserId);

  // 1. CREATE ---------------------------------------------------------------
  const create = await api("POST", "/api/requests", patientTok, {
    hospital: hospitalId,
    bloodGroup: "O+",
    component: "WHOLE_BLOOD",
    unitsRequired: 1,
    urgency: "URGENT",
    neededBy: new Date(Date.now() + 2 * 86400000).toISOString(),
    patientNote: "Golden flow — Panthapath",
    location: { type: "Point", coordinates: [90.3804, 23.7601], address: "West Panthapath, Dhaka" },
  });
  const reqId = create.json?.request?._id;
  check("request created", create.status === 201 && !!reqId, `status ${create.status}`);
  check("status PENDING_VERIFICATION", create.json?.request?.status === "PENDING_VERIFICATION", create.json?.request?.status);
  const reqCoords = create.json?.request?.location?.coordinates;
  check("request has valid non-zero GeoJSON", Array.isArray(reqCoords) && reqCoords.length === 2 && !(reqCoords[0] === 0 && reqCoords[1] === 0), JSON.stringify(reqCoords));

  // 2. VERIFY -------------------------------------------------------------
  const verify = await api("POST", `/api/requests/${reqId}/verify`, hospitalTok, {});
  check("verify API ok", verify.status === 200, `status ${verify.status}`);
  check("status VERIFIED", verify.json?.request?.status === "VERIFIED", verify.json?.request?.status);

  // 3. AI COORDINATION ---------------------------------------------------
  const coord = await api("POST", "/api/ai/coordinate", patientTok, { requestId: reqId });
  const R = coord.json?.result || {};
  check("coordinate API ok", coord.status === 200, `status ${coord.status}`);
  const agents = R.agentStatus || {};
  const agentNames = ["matching", "eligibility", "geo", "risk", "manager"];
  const allAgents = agentNames.every((a) => agents[a] === "COMPLETED");
  check("exactly 5 agents COMPLETED", allAgents, JSON.stringify(agents));
  check("nextAction CONTACT_PRIMARY_DONOR", R.nextAction === "CONTACT_PRIMARY_DONOR", R.nextAction);
  check("best donor is the Panthapath primary", String(R.bestDonor?.donorId) === String(donorUserId), `${R.bestDonor?.name} ${R.bestDonor?.donorId}`);
  check("best donor distance is local (< 2 km)", typeof R.bestDonor?.distanceKm === "number" && R.bestDonor.distanceKm < 2, `${R.bestDonor?.distanceKm} km`);
  check("selection.contactOrder is populated", Array.isArray(R.selection?.contactOrder) && R.selection.contactOrder.length > 0, JSON.stringify(R.selection?.contactOrder));
  check("contactResult.contacted == primary donor", String(R.contactResult?.contacted) === String(donorUserId), JSON.stringify(R.contactResult));
  check("email did not block (NOT_CONFIGURED/ALREADY_CONTACTED/SENT)", ["NOT_CONFIGURED", "ALREADY_CONTACTED", "SENT"].includes(R.emailStatus), R.emailStatus);
  check("candidate list exposed to UI", Array.isArray(R.candidates) && R.candidates.length >= 1, `${R.candidates?.length} candidates`);

  // 4. MATCH_FOUND persisted -------------------------------------------
  const mf = await Notification.findOne({ request: reqId, type: "MATCH_FOUND" }).sort({ createdAt: -1 }).lean();
  check("MATCH_FOUND persisted in Mongo", !!mf, mf ? String(mf._id) : "none");
  check("MATCH_FOUND recipient == selected donor User._id", mf && String(mf.user) === String(donorUserId), mf ? String(mf.user) : "");
  check("MATCH_FOUND.request == this request", mf && String(mf.request) === String(reqId), mf ? String(mf.request) : "");
  check("MATCH_FOUND expiry valid (expiresAt > createdAt)", mf && mf.expiresAt && new Date(mf.expiresAt) > new Date(mf.createdAt), mf ? `${mf.expiresAt}` : "");

  const dp = await DonorProfile.findOne({ user: donorUserId }).lean();
  const du = await User.findById(donorUserId).lean();
  check("selected donor identity aligned (DonorProfile.user == User._id == recipient)",
    String(dp.user) === String(du._id) && String(du._id) === String(mf.user),
    `${dp.user} / ${du._id} / ${mf?.user}`);

  // 5. idempotency: coordinate again, expect no duplicate MATCH_FOUND ---
  await api("POST", "/api/ai/coordinate", patientTok, { requestId: reqId });
  await api("POST", "/api/ai/coordinate", patientTok, { requestId: reqId });
  const mfCount = await Notification.countDocuments({ request: reqId, type: "MATCH_FOUND" });
  check("repeated coordination does NOT create duplicate MATCH_FOUND", mfCount === 1, `${mfCount} notifications`);

  // 6. donor sees it via notifications API ----------------------------
  const dn = await api("GET", "/api/notifications", donorTok);
  const donorNotif = (dn.json?.notifications || []).find((n) => n.type === "MATCH_FOUND" && (n.request?._id === reqId || n.request === reqId));
  check("donor notifications API returns the MATCH_FOUND", !!donorNotif, `HTTP ${dn.status}`);
  check("notification carries hospital + blood group for the card",
    !!donorNotif?.request?.hospital?.name && donorNotif?.request?.bloodGroup === "O+",
    `${donorNotif?.request?.hospital?.name} / ${donorNotif?.request?.bloodGroup}`);

  // 7. wrong donor cannot accept ------------------------------------
  const wrongAccept = await api("POST", `/api/requests/${reqId}/respond`, wrongTok, { response: "ACCEPT" });
  check("wrong donor CANNOT accept the selected donor's request", wrongAccept.status === 403 || wrongAccept.status === 409, `HTTP ${wrongAccept.status} ${wrongAccept.json?.message}`);

  // 8. selected donor accepts -------------------------------------
  const accept = await api("POST", `/api/requests/${reqId}/respond`, donorTok, { response: "ACCEPT" });
  check("selected donor ACCEPT ok", accept.status === 200, `HTTP ${accept.status} ${accept.json?.message || ""}`);
  check("request status MATCHED after accept", accept.json?.request?.status === "MATCHED", accept.json?.request?.status);

  // 9. hospital records + confirms donation ---------------------
  const rec = await api("POST", "/api/donations", hospitalTok, { requestId: reqId, donorId: donorUserId, units: 1 });
  const donationId = rec.json?.donation?._id;
  check("hospital records donation (PENDING)", rec.status === 201 && rec.json?.donation?.status === "PENDING", `HTTP ${rec.status} ${rec.json?.message || ""}`);

  const conf = await api("PATCH", `/api/donations/${donationId}/confirm`, hospitalTok);
  check("hospital confirms donation (CONFIRMED)", conf.status === 200 && conf.json?.donation?.status === "CONFIRMED", `HTTP ${conf.status}`);

  // 10. final DB state -----------------------------------------
  const finalReq = await BloodRequest.findById(reqId).lean();
  check("request unitsFulfilled == 1", finalReq.unitsFulfilled === 1, String(finalReq.unitsFulfilled));
  check("request status FULFILLED (no manual edit)", finalReq.status === "FULFILLED", finalReq.status);

  const patientView = await api("GET", `/api/requests/${reqId}`, patientTok);
  check("patient sees FULFILLED via API", patientView.json?.request?.status === "FULFILLED", patientView.json?.request?.status);

  const inv = await BloodInventory.findOne({ hospital: finalReq.hospital, bloodGroup: "O+", component: "WHOLE_BLOOD" }).lean();
  check("hospital inventory updated (>= 1 unit O+ WHOLE_BLOOD)", inv && inv.units >= 1, inv ? `${inv.units} units` : "no inventory doc");

  const dpAfter = await DonorProfile.findOne({ user: donorUserId }).lean();
  const wbEntry = (dpAfter.eligibility || []).find((e) => e.component === "WHOLE_BLOOD");
  check("donor eligibility recalculated (nextEligibleAt set ~56d out)", !!wbEntry?.nextEligibleAt && new Date(wbEntry.nextEligibleAt) > new Date(), `${wbEntry?.nextEligibleAt}`);
  check("donor totalDonations incremented", (dpAfter.totalDonations || 0) >= 1, String(dpAfter.totalDonations));

  const fulfilledNotif = await Notification.findOne({ request: reqId, type: "REQUEST_FULFILLED" }).lean();
  check("patient got REQUEST_FULFILLED notification", !!fulfilledNotif, fulfilledNotif ? String(fulfilledNotif.user) : "none");

  console.log(`\n================  ${pass.length} PASS / ${fail.length} FAIL  ================`);
  if (fail.length) { console.log("FAILURES:"); fail.forEach((f) => console.log("  - " + f)); }
  console.log("\nREQUEST_ID=" + reqId);
  console.log("DONATION_ID=" + donationId);

  await mongoose.disconnect();
  process.exit(fail.length ? 1 : 0);
}

main().catch(async (e) => { console.error("FATAL", e); await mongoose.disconnect().catch(() => {}); process.exit(1); });
