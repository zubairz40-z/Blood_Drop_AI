require("dotenv").config();

const mongoose = require("mongoose");

/**
 * Exercises the donor accept/decline flow — the piece that turns a VERIFIED
 * request into a MATCHED one, and so unblocks the donation flow.
 *
 * Calls services directly rather than over HTTP. The HTTP layer is a thin
 * wrapper here, and the interesting behaviour (expiry windows, wave
 * advancement, the accept race) is all in responseService.
 */

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}`);
    if (detail !== undefined) console.log(`        ${JSON.stringify(detail)}`);
    failed++;
  }
}

const ORIGIN = { lng: 90.4125, lat: 23.8103 };

function kmEast(km) {
  return [ORIGIN.lng + km / 102, ORIGIN.lat];
}

function yearsAgo(n) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);

  const User = require("../src/models/User");
  const DonorProfile = require("../src/models/DonorProfile");
  const BloodRequest = require("../src/models/BloodRequest");
  const Notification = require("../src/models/Notification");
  const { STATUS } = require("../src/utils/requestStatus");

  const matchingService = require("../src/services/matchingService");
  const responseService = require("../src/services/responseService");
  const matchingAgent = require("../src/agents/donorMatchingAgent");

  const TAG = "resptest";
  const createdUserIds = [];
  const requestIds = [];

  async function seedDonor(label, overrides = {}) {
    const user = await User.create({
      firebaseUid: `${TAG}-${label}-${Date.now()}`,
      name: `Response Test ${label}`,
      email: `${TAG}-${label}@example.invalid`,
      role: "donor",
    });
    createdUserIds.push(user._id);

    await DonorProfile.create({
      user: user._id,
      dateOfBirth: yearsAgo(30),
      weightKg: 70,
      bloodGroup: "O+",
      donationTypes: ["WHOLE_BLOOD"],
      eligibility: [],
      isAvailable: true,
      totalDonations: 0,
      location: { type: "Point", coordinates: kmEast(3) },
      ...overrides,
    });

    return user._id;
  }

  const hospitalUser = await User.findOne({ role: "hospital" });
  if (!hospitalUser) throw new Error("No hospital user found in MongoDB");

  async function makeRequest(overrides = {}) {
    const r = await BloodRequest.create({
      createdBy: hospitalUser._id,
      hospital: hospitalUser._id,
      createdByHospital: true,
      patientName: "Response Test Patient",
      bloodGroup: "O+",
      component: "WHOLE_BLOOD",
      unitsRequired: 1,
      urgency: "URGENT",
      neededBy: daysFromNow(2),
      status: STATUS.VERIFIED,
      location: { type: "Point", coordinates: [ORIGIN.lng, ORIGIN.lat] },
      ...overrides,
    });
    requestIds.push(r._id);
    return r;
  }

  console.log("\nSeeding donors...");
  const donorA = await seedDonor("a", {
    location: { type: "Point", coordinates: kmEast(2) },
  });
  const donorB = await seedDonor("b", {
    location: { type: "Point", coordinates: kmEast(6) },
  });
  const donorC = await seedDonor("c", {
    location: { type: "Point", coordinates: kmEast(10) },
  });
  const stranger = await seedDonor("stranger", {
    location: { type: "Point", coordinates: kmEast(14) },
  });
  console.log(`Seeded ${createdUserIds.length} donors.`);

  const seededOnly = { user: { $in: createdUserIds } };

  async function contactOrderFor(requestId) {
    const set = await matchingService.findCandidates(requestId, {
      donorFilter: seededOnly,
    });
    const sel = await matchingAgent.selectDonors(requestId, { candidateSet: set });
    return sel.contactOrder;
  }

  // ---------------------------------------------------------------
  console.log("\n1. Wave 1 contact");
  // ---------------------------------------------------------------
  const req1 = await makeRequest();
  const order1 = await contactOrderFor(req1._id);

  check("contact order built", order1.length >= 3, order1.length);

  const contact1 = await responseService.contactNextDonor({
    requestId: req1._id,
    contactOrder: order1,
    wave: 1,
    actorId: hospitalUser._id,
  });

  check("first donor contacted", contact1.contacted === order1[0], contact1.contacted);
  check("wave is 1", contact1.wave === 1);
  check("expiry set", Boolean(contact1.expiresAt), contact1.expiresAt);

  const afterContact = await BloodRequest.findById(req1._id);
  check("request moved to MATCHING", afterContact.status === STATUS.MATCHING, afterContact.status);

  const notif = await Notification.findById(contact1.notificationId);
  check("notification is MATCH_FOUND", notif.type === "MATCH_FOUND");
  check("notification belongs to the contacted donor", String(notif.user) === order1[0]);
  check("notification is unread", notif.read === false);

  // URGENT gives a 5 minute window
  const windowMinutes = Math.round((notif.expiresAt - notif.createdAt) / 60000);
  check("URGENT window is 5 minutes", windowMinutes === 5, windowMinutes);

  // ---------------------------------------------------------------
  console.log("\n2. Only a contacted donor can accept");
  // ---------------------------------------------------------------
  try {
    await responseService.acceptMatch({
      requestId: req1._id,
      donorUserId: stranger,
    });
    check("uncontacted donor refused", false, "no error thrown");
  } catch (err) {
    check("uncontacted donor refused", err.status === 403, err.message);
  }

  // ---------------------------------------------------------------
  console.log("\n3. Accept");
  // ---------------------------------------------------------------
  const accepted = await responseService.acceptMatch({
    requestId: req1._id,
    donorUserId: order1[0],
  });

  check("request is MATCHED", accepted.status === STATUS.MATCHED, accepted.status);
  check("donor linked", String(accepted.matchedDonor) === order1[0]);
  check("matchedAt set", Boolean(accepted.matchedAt));

  const notifAfter = await Notification.findById(contact1.notificationId);
  check("notification marked read", notifAfter.read === true);

  const ownerNotifs = await Notification.find({
    user: hospitalUser._id,
    request: req1._id,
    type: "DONOR_ACCEPTED",
  });
  check("request owner notified of acceptance", ownerNotifs.length === 1, ownerNotifs.length);

  // ---------------------------------------------------------------
  console.log("\n4. The accept race — second donor loses");
  // ---------------------------------------------------------------
  // Contact a second donor manually, then have them try to accept a request
  // that is already MATCHED.
  const req2 = await makeRequest();
  const order2 = await contactOrderFor(req2._id);

  await responseService.contactNextDonor({
    requestId: req2._id,
    contactOrder: order2,
    wave: 1,
    actorId: hospitalUser._id,
  });
  await responseService.contactNextDonor({
    requestId: req2._id,
    contactOrder: order2,
    wave: 2,
    actorId: hospitalUser._id,
  });

  await responseService.acceptMatch({
    requestId: req2._id,
    donorUserId: order2[0],
  });

  try {
    await responseService.acceptMatch({
      requestId: req2._id,
      donorUserId: order2[1],
    });
    check("second acceptance refused", false, "no error thrown");
  } catch (err) {
    check("second acceptance refused", err.status === 409, err.message);
    check("message names the conflict", /already accepted/i.test(err.message), err.message);
  }

  // ---------------------------------------------------------------
  console.log("\n5. Decline advances to the next donor");
  // ---------------------------------------------------------------
  const req3 = await makeRequest();
  const order3 = await contactOrderFor(req3._id);

  await responseService.contactNextDonor({
    requestId: req3._id,
    contactOrder: order3,
    wave: 1,
    actorId: hospitalUser._id,
  });

  const declineResult = await responseService.declineMatch({
    requestId: req3._id,
    donorUserId: order3[0],
    contactOrder: order3,
  });

  check("next donor contacted", declineResult.contacted === order3[1], declineResult.contacted);
  check("wave advanced to 2", declineResult.wave === 2, declineResult.wave);

  const wave2Notif = await Notification.findOne({
    user: order3[1],
    request: req3._id,
    type: "MATCH_FOUND",
  });
  check("wave 2 notification exists", Boolean(wave2Notif));
  check("wave recorded on notification", wave2Notif?.wave === 2, wave2Notif?.wave);

  const declineNotifs = await Notification.find({
    user: hospitalUser._id,
    request: req3._id,
    type: "DONOR_DECLINED",
  });
  check("owner notified of decline", declineNotifs.length === 1);

  // The second donor can now accept
  const acceptedAfterDecline = await responseService.acceptMatch({
    requestId: req3._id,
    donorUserId: order3[1],
  });
  check(
    "backup donor can accept after a decline",
    String(acceptedAfterDecline.matchedDonor) === order3[1]
  );

  // ---------------------------------------------------------------
  console.log("\n6. Expiry blocks a late accept");
  // ---------------------------------------------------------------
  const req4 = await makeRequest();
  const order4 = await contactOrderFor(req4._id);

  const contact4 = await responseService.contactNextDonor({
    requestId: req4._id,
    contactOrder: order4,
    wave: 1,
    actorId: hospitalUser._id,
  });

  // Force the window closed rather than waiting five minutes
  await Notification.findByIdAndUpdate(contact4.notificationId, {
    expiresAt: new Date(Date.now() - 1000),
  });

  try {
    await responseService.acceptMatch({
      requestId: req4._id,
      donorUserId: order4[0],
    });
    check("expired acceptance refused", false, "no error thrown");
  } catch (err) {
    check("expired acceptance refused", err.status === 409, err.message);
  }

  // ---------------------------------------------------------------
  console.log("\n7. Sweep advances expired waves");
  // ---------------------------------------------------------------
  const swept = await responseService.sweepExpired({
    contactOrders: { [String(req4._id)]: order4 },
  });

  const sweptThis = swept.find((s) => s.requestId === String(req4._id));
  check("sweep advanced the request", Boolean(sweptThis), swept.length);
  check("sweep contacted the next donor", sweptThis?.contacted === order4[1], sweptThis?.contacted);
  check("sweep moved to wave 2", sweptThis?.wave === 2);

  // ---------------------------------------------------------------
  console.log("\n8. No-show returns the request to the pool");
  // ---------------------------------------------------------------
  const released = await responseService.releaseNoShow({
    requestId: req3._id,
    actorId: hospitalUser._id,
  });

  check("request back to MATCHING", released.status === STATUS.MATCHING, released.status);
  check("matched donor cleared", !released.matchedDonor, released.matchedDonor);

  const history = released.statusHistory.map((h) => `${h.from}->${h.to}`);
  check(
    "round trip recorded in history",
    history.includes("MATCHED->MATCHING"),
    history
  );

  // ---------------------------------------------------------------
  console.log("\n9. Emergency uses a 2 minute window");
  // ---------------------------------------------------------------
  const req5 = await makeRequest({ urgency: "EMERGENCY" });
  const order5 = await contactOrderFor(req5._id);

  const contact5 = await responseService.contactNextDonor({
    requestId: req5._id,
    contactOrder: order5,
    wave: 1,
    actorId: hospitalUser._id,
  });

  const emNotif = await Notification.findById(contact5.notificationId);
  const emWindow = Math.round((emNotif.expiresAt - emNotif.createdAt) / 60000);
  check("EMERGENCY window is 2 minutes", emWindow === 2, emWindow);
  check("emergency title differs", /emergency/i.test(emNotif.title), emNotif.title);

  // ---------------------------------------------------------------
  console.log("\n10. Exhausted contact order");
  // ---------------------------------------------------------------
  const exhausted = await responseService.contactNextDonor({
    requestId: req5._id,
    contactOrder: order5,
    wave: order5.length + 1,
    actorId: hospitalUser._id,
  });

  check("reports exhaustion", exhausted.exhausted === true);
  check("contacts nobody", exhausted.contacted === null);

  // ---------------------------------------------------------------
  console.log("\nCleaning up...");
  // ---------------------------------------------------------------
  await Notification.deleteMany({ request: { $in: requestIds } });
  await DonorProfile.deleteMany({ user: { $in: createdUserIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });
  await BloodRequest.deleteMany({ _id: { $in: requestIds } });
  console.log(`Removed ${createdUserIds.length} donors and ${requestIds.length} requests.`);

  console.log(`\n${passed} passed, ${failed} failed`);
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error("\nScript failed:", err.message);
  console.error(err.stack);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});