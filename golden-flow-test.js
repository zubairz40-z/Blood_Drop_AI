/**
 * Golden Flow E2E Test — BloodDrop AI
 * Uses Firebase REST API for tokens + Playwright for UI screenshots.
 * Dynamically resolves the matched donor from notifications.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const API = 'http://localhost:5000';
const FB_KEY = 'AIzaSyAMni6uqRULFdvLHKHFRSqBXnYdW6Md1Sg';
const SS = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(SS)) fs.mkdirSync(SS, { recursive: true });

const R = [];
const log = (w, m) => { console.log(`[${w}] ${m}`); R.push(`[${w}] ${m}`); };
const ss = async (p, n) => p.screenshot({ path: path.join(SS, n), fullPage: true });

const DONOR_ACCOUNTS = [
  { email: 'evercare.donor@blooddrop.test', password: 'donor1234', name: 'Tanvir' },
  { email: 'square.donor@blooddrop.test', password: 'donor1234', name: 'Nusrat' },
  { email: 'united.donor@blooddrop.test', password: 'donor1234', name: 'Arif' },
  { email: 'kurmitola.donor@blooddrop.test', password: 'donor1234', name: 'Sabbir' },
  { email: 'cmch.donor@blooddrop.test', password: 'donor1234', name: 'Farzana' },
  { email: 'osmani.donor@blooddrop.test', password: 'donor1234', name: 'Rakib' },
];

async function fbToken(email, password) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FB_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const d = await r.json();
  if (d.idToken) return d.idToken;
  throw new Error(`Firebase auth failed for ${email}: ${d.error?.message || JSON.stringify(d)}`);
}

async function api(method, urlPath, token, body) {
  const opts = { method, headers: { Authorization: `Bearer ${token}` } };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  return (await fetch(`${API}${urlPath}`, opts)).json();
}

async function findMatchedDonor(reqId) {
  for (const acct of DONOR_ACCOUNTS) {
    const tok = await fbToken(acct.email, acct.password);
    const dn = await api('GET', '/api/notifications', tok);
    const match = (dn.notifications || []).find(
      n => n.type === 'MATCH_FOUND' && (n.request?._id === reqId || n.request === reqId)
    );
    if (match && !match.expired) {
      return { ...acct, token: tok, notification: match };
    }
  }
  return null;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const patientToken = await fbToken('patient.demo@blooddrop.test', 'patient1234');
  const hospitalToken = await fbToken('square.hospital@blooddrop.test', 'square1234');
  log('TOKEN', 'Patient + Hospital tokens acquired');

  const meResult = await api('GET', '/api/auth/me', hospitalToken);
  const hospitalUserId = meResult.user?._id;
  log('HOSPITAL', `Hospital ID: ${hospitalUserId}`);

  // ═══ STEP 1: CREATE ═══
  log('PATIENT', '=== CREATE REQUEST ===');
  const cr = await api('POST', '/api/requests', patientToken, {
    hospital: hospitalUserId,
    bloodGroup: 'A+',
    component: 'WHOLE_BLOOD',
    unitsRequired: 1,
    urgency: 'EMERGENCY',
    neededBy: new Date(Date.now() + 7 * 86400000).toISOString(),
    patientNote: 'Golden flow E2E test',
  });
  const REQ_ID = cr.request?._id;
  log('PATIENT', `Created: ${REQ_ID} | Status: ${cr.request?.status}`);
  if (!REQ_ID) { log('PATIENT', `FATAL: ${JSON.stringify(cr)}`); await browser.close(); return; }

  // ═══ STEP 2: VERIFY ═══
  log('HOSPITAL', '=== VERIFY ===');
  const vr = await api('POST', `/api/requests/${REQ_ID}/verify`, hospitalToken, {});
  log('HOSPITAL', `Verify: ${vr.success} | Status: ${vr.request?.status}`);

  // ═══ STEP 3: MATCHING ═══
  log('HOSPITAL', '=== START MATCHING ===');
  const mr = await api('POST', `/api/requests/${REQ_ID}/matching`, hospitalToken, {});
  log('HOSPITAL', `Matching: ${mr.success}`);
  if (mr.selection) {
    log('HOSPITAL', `Primary: ${mr.selection.primary}`);
    log('HOSPITAL', `Contact order: ${JSON.stringify(mr.selection.contactOrder)}`);
    log('HOSPITAL', `Contacted: ${mr.contact?.contacted} | Email: ${mr.contact?.emailStatus}`);
  } else {
    log('HOSPITAL', `Error: ${mr.message || JSON.stringify(mr)}`);
  }

  // ═══ STEP 4: FIND DONOR WITH NOTIFICATION ═══
  log('DONOR', '=== FIND MATCHED DONOR ===');
  const matchedDonor = await findMatchedDonor(REQ_ID);
  if (!matchedDonor) {
    log('DONOR', 'FATAL: No test donor has an active MATCH_FOUND notification');
    await browser.close();
    return;
  }
  log('DONOR', `Matched donor: ${matchedDonor.name} (${matchedDonor.email})`);
  log('DONOR', `Notification: wave:${matchedDonor.notification.wave} read:${matchedDonor.notification.read}`);
  const donorToken = matchedDonor.token;

  // ═══ STEP 5: AI COORDINATION ═══
  log('AI', '=== COORDINATION ===');
  const ai = await api('POST', '/api/ai/coordinate', hospitalToken, { requestId: REQ_ID });
  if (ai.result) {
    const r = ai.result;
    log('AI', `Best donor: ${r.bestDonor?.name || 'NONE'} (${r.bestDonor?.bloodGroup}, score:${r.bestDonor?.score})`);
    log('AI', `Distance: ${r.bestDonor?.distanceKm}km ETA:${r.bestDonor?.etaMinutes}min`);
    log('AI', `Agents: ${JSON.stringify(r.agentStatus)}`);
    log('AI', `Email: ${r.emailStatus}`);
  } else {
    log('AI', `AI result: ${JSON.stringify(ai)}`);
  }

  // ═══ STEP 6: DONOR ACCEPTS ═══
  log('DONOR', '=== ACCEPT ===');

  // Try browser accept first
  const dCtx = await browser.newContext();
  const dPage = await dCtx.newPage();
  await dPage.goto(`${BASE}/login`);
  await dPage.fill('input[type="email"]', matchedDonor.email);
  await dPage.fill('input[type="password"]', matchedDonor.password);
  await dPage.click('button[type="submit"]');
  await dPage.waitForURL(/\/donor/, { timeout: 15000 });
  await dPage.goto(`${BASE}/donor`, { waitUntil: 'networkidle' });
  await dPage.waitForTimeout(3000);
  await ss(dPage, '04-donor-dashboard.png');

  const dText = await dPage.textContent('body');
  log('DONOR', `Browser "Blood Match": ${dText.includes('Blood Match')}`);
  log('DONOR', `Browser "Accept": ${dText.includes('Accept')}`);
  const acceptBtns = await dPage.locator('button:has-text("Accept")').count();
  log('DONOR', `Accept buttons: ${acceptBtns}`);

  if (acceptBtns > 0) {
    log('DONOR', 'Clicking Accept in browser...');
    await dPage.locator('button:has-text("Accept")').first().click();
    await dPage.waitForTimeout(3000);
    await ss(dPage, '05-donor-accepted.png');
  } else {
    log('DONOR', 'No browser Accept. Using API...');
    const ar = await api('POST', `/api/requests/${REQ_ID}/respond`, donorToken, { response: 'ACCEPT' });
    log('DONOR', `API Accept: ${ar.success} | Status: ${ar.request?.status || ar.message}`);
  }

  // ═══ STEP 7: HOSPITAL records + confirms ═══
  log('HOSPITAL', '=== RECORD DONATION ===');
  const rs = await api('GET', `/api/requests/${REQ_ID}`, hospitalToken);
  log('HOSPITAL', `Request: ${rs.request?.status} | Matched: ${rs.request?.matchedDonor}`);

  let DONATION_ID = null;
  if (rs.request?.status === 'MATCHED' && rs.request?.matchedDonor) {
    const matchedId = typeof rs.request.matchedDonor === 'object' ? rs.request.matchedDonor._id || rs.request.matchedDonor : rs.request.matchedDonor;
    const dr = await api('POST', '/api/donations', hospitalToken, {
      requestId: REQ_ID, donorId: matchedId, units: 1,
    });
    log('HOSPITAL', `Create donation: ${dr.success} | ID: ${dr.donation?._id} | ${dr.message || ''}`);
    DONATION_ID = dr.donation?._id;

    if (DONATION_ID) {
      log('HOSPITAL', '=== CONFIRM DONATION ===');
      const cf = await api('PATCH', `/api/donations/${DONATION_ID}/confirm`, hospitalToken);
      log('HOSPITAL', `Confirm: ${cf.success} | Status: ${cf.donation?.status}`);
    }
  } else {
    log('HOSPITAL', `Cannot record: status=${rs.request?.status}`);
  }

  const fin = await api('GET', `/api/requests/${REQ_ID}`, hospitalToken);
  log('HOSPITAL', `Final: ${fin.request?.status} | Fulfilled: ${fin.request?.unitsFulfilled}/${fin.request?.unitsRequired}`);

  // ═══ STEP 8: PATIENT sees FULFILLED ═══
  log('PATIENT', '=== FINAL ===');
  const pf = await api('GET', `/api/requests/${REQ_ID}`, patientToken);
  log('PATIENT', `Request: ${pf.request?.status} | Fulfilled: ${pf.request?.unitsFulfilled}/${pf.request?.unitsRequired}`);

  const pCtx = await browser.newContext();
  const pPage = await pCtx.newPage();
  await pPage.goto(`${BASE}/login`);
  await pPage.fill('input[type="email"]', 'patient.demo@blooddrop.test');
  await pPage.fill('input[type="password"]', 'patient1234');
  await pPage.click('button[type="submit"]');
  await pPage.waitForURL(/\/patient/, { timeout: 15000 });
  await pPage.goto(`${BASE}/patient/requests/${REQ_ID}/tracking`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await pPage.waitForTimeout(2000);
  await ss(pPage, '06-patient-fulfilled.png');
  const tText = await pPage.textContent('body');
  log('PATIENT', `FULFILLED in browser: ${tText.includes('FULFILLED') || tText.includes('fulfilled') || tText.includes('Fulfilled')}`);

  await pPage.goto(`${BASE}/patient/requests/${REQ_ID}/coordination`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await pPage.waitForTimeout(3000);
  await ss(pPage, '03-ai-coordination.png');

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('  GOLDEN FLOW REPORT');
  console.log('='.repeat(60));
  console.log(`  Request ID: ${REQ_ID}`);
  console.log(`  Donation ID: ${DONATION_ID || 'N/A'}`);
  console.log(`  Matched Donor: ${matchedDonor.name} (${matchedDonor.email})`);
  console.log('='.repeat(60));
  R.forEach(l => console.log(l));
  console.log('='.repeat(60));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
