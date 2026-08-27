/**
 * golden-flow-playwright.js — BloodDrop AI complete golden flow, proven through
 * the real browser UI with separate browser contexts per role.
 *
 *   patient creates request  ->  hospital verifies  ->  patient AI coordination
 *   ->  MATCH_FOUND persisted  ->  donor logs in, sees Accept/Decline, accepts
 *   ->  hospital records + confirms donation  ->  patient sees FULFILLED
 *
 * Screenshots: test-screenshots/final-working-flow/
 *
 * Prereqs: backend on :5000, frontend on :5173, and
 *          `node backend/scripts/prepare-golden-demo.js` run first.
 */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const API = 'http://localhost:5000';
const FB_KEY = 'AIzaSyAMni6uqRULFdvLHKHFRSqBXnYdW6Md1Sg';
const SS = path.join(__dirname, 'test-screenshots', 'final-working-flow');
fs.mkdirSync(SS, { recursive: true });

const results = [];
const log = (tag, msg) => { const line = `[${tag}] ${msg}`; console.log(line); results.push(line); };
const shot = (page, name) => page.screenshot({ path: path.join(SS, name), fullPage: true });

const PATIENT = { email: 'patient.demo@blooddrop.test', password: 'patient1234' };
const HOSPITAL = { email: 'square.hospital@blooddrop.test', password: 'square1234' };
// The exact Square Hospitals Ltd account used as HOSPITAL above (there are two
// "Square Hospitals Ltd" records; the request must target THIS one).
const SQUARE_HOSPITAL_ID = '6a8f7169d126a5e4fd3311e9';
// last-resort donor map (name -> creds) if we cannot read the email from mongo-proof
const DONOR_BY_EMAIL = {
  'square.donor@blooddrop.test': 'donor1234',
  'kurmitola.donor@blooddrop.test': 'donor1234',
  'cmch.donor@blooddrop.test': 'donor1234',
};

function mongoProof(requestId) {
  const raw = execFileSync('node', ['scripts/mongo-proof.js', requestId], {
    cwd: path.join(__dirname, 'backend'), encoding: 'utf8',
  });
  // A dotenv banner pollutes stdout in this environment, so mongo-proof wraps
  // its JSON in sentinels.
  const m = raw.match(/<<<PROOF_JSON>>>([\s\S]*?)<<<END_PROOF_JSON>>>/);
  if (!m) throw new Error('mongo-proof produced no JSON:\n' + raw);
  return JSON.parse(m[1]);
}

async function login(context, { email, password }, expectPath) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(new RegExp(expectPath.replace('/', '\\/')), { timeout: 20000 });
  return page;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const t0 = Date.now();

  // ================= PATIENT: create request =================
  const patientCtx = await browser.newContext();
  const patientPage = await login(patientCtx, PATIENT, '/patient');
  log('PATIENT', 'logged in');

  let reqId = null;
  patientPage.on('response', async (res) => {
    if (res.request().method() === 'POST' && res.url().endsWith('/api/requests')) {
      try { const j = await res.json(); reqId = j?.request?._id || reqId; } catch { /* ignore */ }
    }
  });

  await patientPage.goto(`${BASE}/patient/requests/create`, { waitUntil: 'networkidle' });
  await patientPage.waitForFunction(() => {
    const s = document.querySelector('#hospital');
    return s && s.options.length > 1;
  }, null, { timeout: 20000 });
  await patientPage.selectOption('#bloodGroup', 'O+');
  await patientPage.selectOption('#donationType', 'Whole Blood');
  await patientPage.fill('input[name="units"]', '1');
  const neededBy = new Date(Date.now() + 2 * 86400000);
  const pad = (n) => String(n).padStart(2, '0');
  const dtLocal = `${neededBy.getFullYear()}-${pad(neededBy.getMonth() + 1)}-${pad(neededBy.getDate())}T${pad(neededBy.getHours())}:${pad(neededBy.getMinutes())}`;
  await patientPage.fill('input[name="neededBy"]', dtLocal);
  // pick the exact Square Hospitals Ltd account the hospital user signs in as
  const hasSquareOption = await patientPage.$eval('#hospital', (sel, id) =>
    [...sel.options].some((o) => o.value === id), SQUARE_HOSPITAL_ID);
  if (!hasSquareOption) throw new Error(`hospital option ${SQUARE_HOSPITAL_ID} not in dropdown`);
  await patientPage.selectOption('#hospital', SQUARE_HOSPITAL_ID);
  await patientPage.fill('input[name="locationAddress"]', 'West Panthapath, Dhaka');
  await patientPage.click('button[type="button"]:has-text("URGENT")');
  await shot(patientPage, '01-patient-create.png');
  await patientPage.click('button[type="submit"]:has-text("Find Donor")');
  await patientPage.waitForSelector('text=Request Created', { timeout: 20000 });
  for (let i = 0; i < 20 && !reqId; i++) await patientPage.waitForTimeout(250);
  log('PATIENT', `request created: ${reqId}`);
  if (!reqId) { throw new Error('could not capture request id from POST /api/requests'); }

  await patientPage.goto(`${BASE}/patient/requests/${reqId}/tracking`, { waitUntil: 'networkidle' });
  await patientPage.waitForTimeout(1500);
  await shot(patientPage, '02-request-pending.png');
  const pendingText = await patientPage.textContent('body');
  log('PATIENT', `tracking shows pending verification: ${/pending/i.test(pendingText)}`);

  // ================= HOSPITAL: verify =================
  const hospitalCtx = await browser.newContext();
  const hospitalPage = await login(hospitalCtx, HOSPITAL, '/hospital');
  log('HOSPITAL', 'logged in');
  await hospitalPage.goto(`${BASE}/hospital/requests`, { waitUntil: 'networkidle' });
  await hospitalPage.waitForSelector('h3:has-text("Awaiting your verification")', { timeout: 15000 });
  const shortId = String(reqId).slice(-6);
  await hospitalPage.waitForSelector(`text=REQ-${shortId.toUpperCase()}`, { timeout: 15000 });
  await shot(hospitalPage, '03a-hospital-queue.png');
  const pendingRow = hospitalPage.locator('div.rounded-xl', { hasText: `REQ-${shortId.toUpperCase()}` }).first();
  await pendingRow.getByRole('button', { name: /verify/i }).click();
  await hospitalPage.waitForSelector('text=has been verified', { timeout: 15000 });
  await shot(hospitalPage, '03-hospital-verify.png');
  let proof = mongoProof(reqId);
  log('HOSPITAL', `status after verify (DB): ${proof.request.status}`);
  if (proof.request.status !== 'VERIFIED') throw new Error(`expected VERIFIED, got ${proof.request.status}`);

  // ================= PATIENT: AI coordination =================
  let coordResult = null;
  patientPage.on('response', async (res) => {
    if (res.request().method() === 'POST' && res.url().endsWith('/api/ai/coordinate')) {
      try { const j = await res.json(); coordResult = j?.result || coordResult; } catch { /* ignore */ }
    }
  });
  await patientPage.goto(`${BASE}/patient/requests/${reqId}/coordination`, { waitUntil: 'networkidle' });
  await patientPage.waitForSelector('text=AI Coordination', { timeout: 20000 });
  await patientPage.waitForFunction(() => /COMPLETED/.test(document.body.innerText), null, { timeout: 25000 }).catch(() => {});
  await patientPage.waitForTimeout(2500);
  await shot(patientPage, '04-nearby-donors.png');
  await patientPage.evaluate(() => window.scrollBy(0, 500));
  await patientPage.waitForTimeout(500);
  await shot(patientPage, '05-five-agents.png');
  await patientPage.evaluate(() => window.scrollBy(0, 700));
  await patientPage.waitForTimeout(500);
  await shot(patientPage, '06-best-donor.png');

  for (let i = 0; i < 20 && !coordResult; i++) await patientPage.waitForTimeout(250);
  const agents = coordResult?.agentStatus || {};
  log('AI', `agentStatus: ${JSON.stringify(agents)}`);
  log('AI', `nextAction: ${coordResult?.nextAction}  bestDonor: ${coordResult?.bestDonor?.name} (${coordResult?.bestDonor?.distanceKm} km)`);
  log('AI', `candidates: ${(coordResult?.candidates || []).length}`);

  // ================= MATCH_FOUND Mongo proof =================
  proof = mongoProof(reqId);
  log('DB', `MATCH_FOUND count: ${proof.matchFoundCount}`);
  log('DB', `MATCH_FOUND recipient: ${proof.matchFound?.recipientUserId}  expiryValid: ${proof.matchFound?.expiryValid}`);
  log('DB', `identity assertion allMatch: ${proof.identityAssertion?.allMatch}`);
  const donorEmail = proof.selectedDonor?.email;
  const donorPassword = DONOR_BY_EMAIL[donorEmail] || 'donor1234';
  log('DB', `selected donor: ${proof.selectedDonor?.name} <${donorEmail}>`);
  if (!proof.matchFound || !proof.identityAssertion?.allMatch) throw new Error('MATCH_FOUND / identity assertion failed');

  const proofHtml = `<html><body style="font-family:ui-monospace,Menlo,monospace;background:#0b1021;color:#d6e2ff;padding:24px">
    <h2 style="color:#7aa2ff">MATCH_FOUND — MongoDB proof (request ${reqId})</h2>
    <pre style="white-space:pre-wrap;font-size:13px;line-height:1.5">${JSON.stringify({
      request: proof.request, hospital: proof.hospital, matchFound: proof.matchFound,
      selectedDonor: proof.selectedDonor, identityAssertion: proof.identityAssertion,
    }, null, 2).replace(/</g, '&lt;')}</pre></body></html>`;
  const proofPage = await browser.newContext().then((c) => c.newPage());
  await proofPage.setContent(proofHtml);
  await shot(proofPage, '07-match-found-mongo-proof.png');

  // ================= DONOR: see match + accept =================
  const donorCtx = await browser.newContext();
  const donorPage = await login(donorCtx, { email: donorEmail, password: donorPassword }, '/donor');
  log('DONOR', `logged in as ${donorEmail}`);
  await donorPage.goto(`${BASE}/donor`, { waitUntil: 'networkidle' });
  await donorPage.waitForSelector('text=Emergency Blood Matches', { timeout: 20000 });
  await donorPage.waitForTimeout(1200);
  await shot(donorPage, '08-donor-notification.png');
  const acceptBtn = donorPage.locator('button:has-text("Accept")').first();
  const declineBtn = donorPage.locator('button:has-text("Decline")').first();
  log('DONOR', `Accept visible: ${await acceptBtn.isVisible()}  Decline visible: ${await declineBtn.isVisible()}`);
  let acceptStatus = null;
  donorPage.on('response', async (res) => {
    if (res.request().method() === 'POST' && /\/api\/requests\/.+\/respond$/.test(res.url())) {
      try { const j = await res.json(); acceptStatus = j?.request?.status || acceptStatus; } catch { /* ignore */ }
    }
  });
  await acceptBtn.click();
  await donorPage.waitForTimeout(3000);
  await shot(donorPage, '09-donor-accept.png');
  proof = mongoProof(reqId);
  log('DONOR', `request status after accept (DB): ${proof.request.status}  matchedDonor: ${proof.request.matchedDonor}`);
  if (proof.request.status !== 'MATCHED') throw new Error(`expected MATCHED, got ${proof.request.status}`);

  // ================= HOSPITAL: record + confirm =================
  await hospitalPage.goto(`${BASE}/hospital/requests`, { waitUntil: 'networkidle' });
  await hospitalPage.waitForSelector('h3:has-text("Active requests")', { timeout: 15000 });
  await hospitalPage.waitForSelector('button:has-text("Record Donation")', { timeout: 15000 });
  await shot(hospitalPage, '10-hospital-accepted-donor.png');
  await hospitalPage.click('button:has-text("Record Donation")');
  await hospitalPage.waitForURL(/\/hospital\/donations/, { timeout: 15000 });
  await hospitalPage.waitForSelector('button:has-text("Confirm")', { timeout: 15000 });
  await hospitalPage.waitForTimeout(800);
  await hospitalPage.click('button:has-text("Confirm")');
  await hospitalPage.waitForTimeout(3000);
  await shot(hospitalPage, '11-hospital-confirm.png');
  proof = mongoProof(reqId);
  log('HOSPITAL', `donation: ${proof.donation?.status}  request: ${proof.request.status}  units ${proof.request.unitsFulfilled}/${proof.request.unitsRequired}  inventory: ${JSON.stringify(proof.inventory)}`);
  if (proof.request.status !== 'FULFILLED') throw new Error(`expected FULFILLED, got ${proof.request.status}`);

  // ================= PATIENT: sees FULFILLED =================
  await patientPage.goto(`${BASE}/patient/requests/${reqId}/tracking`, { waitUntil: 'networkidle' });
  await patientPage.waitForTimeout(5000); // tracking polls every 4s
  await shot(patientPage, '12-patient-fulfilled.png');
  const finalText = await patientPage.textContent('body');
  const patientSeesFulfilled = /fulfilled/i.test(finalText);
  log('PATIENT', `browser shows FULFILLED: ${patientSeesFulfilled}`);
  if (!patientSeesFulfilled) throw new Error('patient UI does not show FULFILLED');

  await browser.close();

  const proofFinal = mongoProof(reqId);
  console.log('\n' + '='.repeat(64));
  console.log('  GOLDEN FLOW — PLAYWRIGHT — PASSED');
  console.log('='.repeat(64));
  console.log(`  Request ${reqId}`);
  console.log(`  Elapsed ${(Date.now() - t0) / 1000}s`);
  console.log(`  Final: request=${proofFinal.request.status} donation=${proofFinal.donation?.status} inventory=${JSON.stringify(proofFinal.inventory)}`);
  console.log(`  Donor eligibility recalculated: ${JSON.stringify(proofFinal.selectedDonor?.wholeBloodEligibility)}`);
  console.log('='.repeat(64));
  results.forEach((l) => console.log('  ' + l));
  console.log('\n  screenshots -> ' + SS);
  fs.writeFileSync(path.join(SS, '_log.txt'), results.join('\n'));
}

main().catch((e) => { console.error('\nGOLDEN FLOW FAILED:', e.stack || e.message); process.exit(1); });
