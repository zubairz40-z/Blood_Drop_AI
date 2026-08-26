/**
 * Blood component codes. Enum codes, not display strings — display text
 * belongs in the frontend, so changing a label never touches the database.
 */
const COMPONENTS = {
  WHOLE_BLOOD: "WHOLE_BLOOD",
  PLASMA: "PLASMA",
  PLATELETS: "PLATELETS",
  DOUBLE_RED_CELLS: "DOUBLE_RED_CELLS",
};

const COMPONENT_CODES = Object.values(COMPONENTS);

/** Minimum days between donations, per component. */
const DEFERRAL_DAYS = {
  WHOLE_BLOOD: 56,
  PLASMA: 28,
  PLATELETS: 7,
  DOUBLE_RED_CELLS: 112,
};

/** Annual caps where they apply. Null means no fixed cap. */
const ANNUAL_LIMIT = {
  WHOLE_BLOOD: 6,
  PLASMA: 24,
  PLATELETS: 24,
  DOUBLE_RED_CELLS: 3,
};

/** Minimum weight in kg to donate a given component. */
const MIN_WEIGHT_KG = {
  WHOLE_BLOOD: 50,
  PLASMA: 50,
  PLATELETS: 50,
  DOUBLE_RED_CELLS: 59,
};

const MIN_AGE_YEARS = 18;
const MAX_AGE_YEARS = 65;

/**
 * Given a donation date and component, returns when the donor is next eligible.
 */
function calculateNextEligibleAt(component, donatedAt) {
  const days = DEFERRAL_DAYS[component];
  if (!days) throw new Error(`Unknown component: ${component}`);

  const next = new Date(donatedAt);
  next.setDate(next.getDate() + days);
  return next;
}

/** Age in whole years from a date of birth. */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Can this donor give this component right now?
 *
 * Deterministic medical verdict only. Deliberately does NOT check
 * isAvailable (a donor preference, not a medical fact) or blood group
 * compatibility (that depends on the request, not the donor).
 *
 * @param {object} profile   A DonorProfile document
 * @param {string} component One of COMPONENT_CODES
 * @param {Date}   asOf      Evaluation time; injectable so tests aren't
 *                           dependent on the real clock
 * @returns {{eligible: boolean, reasons: string[], nextEligibleAt: Date|null}}
 *          reasons is empty when eligible. nextEligibleAt is set only when
 *          the block is temporary; null when it can never clear on its own.
 */
function checkEligibility(profile, component, asOf = new Date()) {
  const reasons = [];
  let nextEligibleAt = null;

  if (!COMPONENT_CODES.includes(component)) {
    throw new Error(`Unknown component: ${component}`);
  }

  // --- Permanent-ish blocks: no future date will fix these on its own ---

  if (!profile.donationTypes?.includes(component)) {
    reasons.push("Donor does not offer this component");
  }

  const age = calculateAge(profile.dateOfBirth);
  if (age === null) {
    reasons.push("Date of birth missing");
  } else if (age < MIN_AGE_YEARS) {
    reasons.push(`Under minimum age of ${MIN_AGE_YEARS}`);
  } else if (age > MAX_AGE_YEARS) {
    reasons.push(`Over maximum age of ${MAX_AGE_YEARS}`);
  }

  const minWeight = MIN_WEIGHT_KG[component];
  if (typeof profile.weightKg !== "number") {
    reasons.push("Weight missing");
  } else if (profile.weightKg < minWeight) {
    reasons.push(`Below ${minWeight}kg minimum for this component`);
  }

  // --- Timing blocks: these clear on a known date ---

  // No entry means the donor has never given this component, so nothing
  // is deferring them. Decided deliberately: new donors must be matchable.
  const entry = (profile.eligibility || []).find(
    (e) => e.component === component
  );

  if (entry) {
    if (entry.nextEligibleAt && new Date(entry.nextEligibleAt) > asOf) {
      const d = new Date(entry.nextEligibleAt);
      reasons.push(`Deferred until ${d.toISOString().split("T")[0]}`);
      nextEligibleAt = d;
    }

    if (
      entry.medicallyDeferredUntil &&
      new Date(entry.medicallyDeferredUntil) > asOf
    ) {
      const d = new Date(entry.medicallyDeferredUntil);
      const why = entry.deferralReason
        ? `Medically deferred until ${d.toISOString().split("T")[0]} (${entry.deferralReason})`
        : `Medically deferred until ${d.toISOString().split("T")[0]}`;
      reasons.push(why);
      // Whichever block lifts last is the real date
      if (!nextEligibleAt || d > nextEligibleAt) nextEligibleAt = d;
    }

    const cap = ANNUAL_LIMIT[component];
    if (cap !== null && (entry.donationsThisYear || 0) >= cap) {
      reasons.push(`Annual limit of ${cap} reached for this component`);
      const yearEnd = new Date(Date.UTC(asOf.getUTCFullYear() + 1, 0, 1));
      if (!nextEligibleAt || yearEnd > nextEligibleAt) nextEligibleAt = yearEnd;
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    nextEligibleAt: reasons.length === 0 ? null : nextEligibleAt,
  };
}

module.exports = {
  COMPONENTS,
  COMPONENT_CODES,
  DEFERRAL_DAYS,
  ANNUAL_LIMIT,
  MIN_WEIGHT_KG,
  MIN_AGE_YEARS,
  MAX_AGE_YEARS,
  calculateNextEligibleAt,
  calculateAge,
  checkEligibility,
};