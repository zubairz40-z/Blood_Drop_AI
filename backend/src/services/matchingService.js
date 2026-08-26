const DonorProfile = require("../models/DonorProfile");
const BloodRequest = require("../models/BloodRequest");
const { STATUS, assertTransition } = require("../utils/requestStatus");
const {
  isCompatible,
  compatibleDonorGroups,
  checkEligibility,
  estimateEtaMinutes,
  SEARCH_RADIUS_KM,
} = require("../utils/donationRules");

/**
 * Scoring weights by urgency. Mandatory filters are not scored — they gate
 * entry — so these only rank the donors who already qualify.
 *
 * The split shifts with urgency on purpose. In an emergency the only thing
 * that matters is who can physically arrive soonest, so distance takes
 * almost all the weight. For a routine request there is time to prefer a
 * donor with a track record, who is likelier to actually turn up.
 *
 * Each pair sums to 100, so scores stay comparable across urgencies.
 */
const WEIGHTS = {
  EMERGENCY: { distance: 90, history: 10 },
  URGENT: { distance: 75, history: 25 },
  ROUTINE: { distance: 55, history: 45 },
};

const DEFAULT_WEIGHTS = WEIGHTS.URGENT;

/** A donor with this many past donations scores full marks on reliability. */
const HISTORY_SATURATION = 5;

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

/**
 * Closer is better, on a linear falloff to the search radius.
 * A donor at 0 km scores the full weight; one at the radius edge scores 0.
 */
function scoreDistance(distanceKm, radiusKm, weight = DEFAULT_WEIGHTS.distance) {
  if (distanceKm >= radiusKm) return 0;
  return Math.round(weight * (1 - distanceKm / radiusKm));
}

/**
 * Past donations as a proxy for reliability — someone who has shown up
 * five times is likelier to show up again. Saturates so a donor with 50
 * donations doesn't crowd out a nearby donor with 5.
 */
function scoreHistory(totalDonations, weight = DEFAULT_WEIGHTS.history) {
  const n = Math.min(totalDonations || 0, HISTORY_SATURATION);
  return Math.round(weight * (n / HISTORY_SATURATION));
}

/**
 * Finds ranked donor candidates for a request.
 *
 * Geography runs first because $geoNear is the only stage MongoDB can do
 * for us — it turns "every donor in the database" into "the fifty nearest"
 * inside the query. Every later filter then runs over a small in-memory set.
 *
 * Returns the Shared Contract 1 shape: { requestId, candidates: [...] }.
 */
async function findCandidates(
  requestId,
  { limit = 10, asOf = new Date(), donorFilter } = {}
) {
  const request = await BloodRequest.findById(requestId);
  if (!request) fail("Request not found.", 404);

  if (request.status !== STATUS.VERIFIED && request.status !== STATUS.MATCHING) {
    fail(
      `Matching needs a VERIFIED request. This one is ${request.status}.`,
      409
    );
  }

  const coords = request.location?.coordinates;
  if (!coords || coords.length !== 2) {
    fail(
      "This request has no coordinates, so donors cannot be ranked by distance.",
      409
    );
  }

  const radiusKm = SEARCH_RADIUS_KM[request.urgency] ?? 25;
  const weights = WEIGHTS[request.urgency] ?? DEFAULT_WEIGHTS;

  // Only these groups can help, so let the database discard the rest
  const acceptableGroups = compatibleDonorGroups(
    request.bloodGroup,
    request.component
  );

  // Stage 1 — geography, in the database.
  // $geoNear must be the first stage of the pipeline, and distanceField is
  // returned in metres because the index is spherical.
  const nearby = await DonorProfile.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: coords },
        distanceField: "distanceMeters",
        maxDistance: radiusKm * 1000,
        spherical: true,
        query: {
          bloodGroup: { $in: acceptableGroups },
          donationTypes: request.component,
          isAvailable: true,
          // Optional narrowing, used by tests to isolate themselves from
          // whatever donors happen to exist in the database. Never set in
          // production — a filter here would silently hide real donors.
          ...(donorFilter ?? {}),
        },
      },
    },
    { $limit: 50 },
  ]);

  // Stage 2 — medical rules, in Node.
  // checkEligibility is deliberately not expressible as a Mongo query: it is
  // the single source of medical truth and must not be duplicated in a
  // pipeline where it could drift out of sync.
  const candidates = [];

  for (const donor of nearby) {
    const verdict = checkEligibility(donor, request.component, asOf);
    if (!verdict.eligible) continue;

    const distanceKm = Math.round((donor.distanceMeters / 1000) * 10) / 10;
    const etaMinutes = estimateEtaMinutes(distanceKm);

    const score =
      scoreDistance(distanceKm, radiusKm, weights.distance) +
      scoreHistory(donor.totalDonations, weights.history);

    candidates.push({
      donorId: String(donor.user),
      bloodGroup: donor.bloodGroup,
      component: request.component,
      eligible: true,
      available: true,
      distanceKm,
      etaMinutes,
      score,
      reasons: [
        `Compatible with ${request.bloodGroup}`,
        "Eligible",
        "Available",
        distanceKm <= radiusKm / 2 ? "Nearby" : "Within range",
      ],
    });
  }

  // Highest score first; ties broken by proximity
  candidates.sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);

  return {
    requestId: String(request._id),
    radiusKm,
    weights,
    candidates: candidates.slice(0, limit),
  };
}

/**
 * Explains why a specific donor is or isn't a candidate for a request.
 * Used by the Eligibility Agent, and useful when a hospital asks why
 * someone didn't appear in the list.
 */
async function explainDonor(requestId, donorUserId, asOf = new Date()) {
  const request = await BloodRequest.findById(requestId);
  if (!request) fail("Request not found.", 404);

  const profile = await DonorProfile.findOne({ user: donorUserId });
  if (!profile) fail("Donor profile not found.", 404);

  const reasons = [];

  const compatible = isCompatible(
    profile.bloodGroup,
    request.bloodGroup,
    request.component
  );
  if (!compatible) {
    reasons.push(
      `${profile.bloodGroup} cannot give ${request.component} to ${request.bloodGroup}`
    );
  }

  if (!profile.donationTypes.includes(request.component)) {
    reasons.push("Donor does not offer this component");
  }

  if (!profile.isAvailable) {
    reasons.push("Donor is currently unavailable");
  }

  const verdict = checkEligibility(profile, request.component, asOf);
  reasons.push(...verdict.reasons);

  return {
    donorId: String(donorUserId),
    eligible: reasons.length === 0,
    reasons,
    nextEligibleAt: verdict.nextEligibleAt,
  };
}

/**
 * Moves a VERIFIED request into MATCHING and records who is being contacted.
 *
 * Separate from findCandidates because finding candidates is a read — it can
 * run repeatedly with no side effects — whereas this commits the request to
 * the matching process.
 */
async function beginMatching(requestId, actorId) {
  const request = await BloodRequest.findById(requestId);
  if (!request) fail("Request not found.", 404);

  if (request.status === STATUS.MATCHING) return request;

  assertTransition(request.status, STATUS.MATCHING);
  request.applyStatus(STATUS.MATCHING, actorId, "Donor matching started");
  return request.save();
}

/**
 * Links an accepting donor and moves the request to MATCHED.
 */
async function assignDonor(requestId, donorUserId, actorId) {
  const request = await BloodRequest.findById(requestId);
  if (!request) fail("Request not found.", 404);

  assertTransition(request.status, STATUS.MATCHED);
  request.matchedDonor = donorUserId;
  request.matchedAt = new Date();
  request.applyStatus(STATUS.MATCHED, actorId, "Donor accepted");
  return request.save();
}

/**
 * Returns a MATCHED request to the pool — a donor withdrew or never arrived.
 */
async function releaseDonor(requestId, actorId, note) {
  const request = await BloodRequest.findById(requestId);
  if (!request) fail("Request not found.", 404);

  assertTransition(request.status, STATUS.MATCHING);
  request.matchedDonor = undefined;
  request.matchedAt = undefined;
  request.applyStatus(STATUS.MATCHING, actorId, note || "Donor released");
  return request.save();
}

module.exports = {
  findCandidates,
  explainDonor,
  scoreDistance,
  scoreHistory,
  beginMatching,
  assignDonor,
  releaseDonor,
  WEIGHTS,
};