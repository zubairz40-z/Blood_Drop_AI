const STATUS = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  MATCHING: "MATCHING",
  MATCHED: "MATCHED",
  FULFILLED: "FULFILLED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
};

const STATUS_CODES = Object.values(STATUS);

/**
 * Which statuses each status may move to.
 * Empty array = terminal state, nothing follows.
 */
const ALLOWED_TRANSITIONS = {
  PENDING_VERIFICATION: [STATUS.VERIFIED, STATUS.REJECTED, STATUS.CANCELLED, STATUS.EXPIRED],
  VERIFIED: [STATUS.MATCHING, STATUS.CANCELLED, STATUS.EXPIRED],
  MATCHING: [STATUS.MATCHED, STATUS.CANCELLED, STATUS.EXPIRED],
  MATCHED: [STATUS.FULFILLED, STATUS.CANCELLED],
  FULFILLED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
};

/** Statuses from which nothing further can happen. */
const TERMINAL_STATUSES = STATUS_CODES.filter(
  (s) => ALLOWED_TRANSITIONS[s].length === 0
);

function canTransition(from, to) {
  const allowed = ALLOWED_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
}

function isTerminal(status) {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Throws a 409-flavoured error if the move isn't legal.
 * Controllers catch this and turn it into a response.
 */
function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const err = new Error(
      isTerminal(from)
        ? `This request is already ${from} and cannot be changed.`
        : `Cannot change a request from ${from} to ${to}.`
    );
    err.status = 409;
    throw err;
  }
}

module.exports = {
  STATUS,
  STATUS_CODES,
  ALLOWED_TRANSITIONS,
  TERMINAL_STATUSES,
  canTransition,
  isTerminal,
  assertTransition,
};