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
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
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
};