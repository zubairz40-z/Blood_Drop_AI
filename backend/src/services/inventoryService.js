const BloodInventory = require("../models/BloodInventory");
const { COMPONENT_CODES, BLOOD_GROUPS } = require("../utils/donationRules");

/** Small helper so callers get consistent HTTP-flavoured errors. */
function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

/**
 * Returns every inventory row for a hospital.
 *
 * @param {string} hospitalId  The hospital's User _id
 * @returns {Promise<object[]> Array of inventory documents
 */
async function getInventory(hospitalId) {
  return BloodInventory.find({ hospital: hospitalId })
    .sort({ bloodGroup: 1, component: 1 });
}

/**
 * Bulk upsert inventory rows for a hospital.
 *
 * For each item in the array, finds the existing row by (hospital, bloodGroup,
 * component) or creates it, then sets the units. Rejects any item with negative
 * units before touching the database.
 *
 * @param {string} hospitalId  The hospital's User _id
 * @param {Array}  items       [{ bloodGroup, component, units }]
 * @param {string} userId      The user performing the update (stored in updatedBy)
 * @returns {Promise<object[]>  The updated inventory rows
 */
async function upsertInventory(hospitalId, items, userId) {
  if (!Array.isArray(items) || items.length === 0) {
    fail("items must be a non-empty array.");
  }

  // Validate all items first — reject the whole batch if anything is wrong
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.bloodGroup || !BLOOD_GROUPS.includes(item.bloodGroup)) {
      fail(`Item ${i}: invalid bloodGroup "${item.bloodGroup}".`);
    }
    if (!item.component || !COMPONENT_CODES.includes(item.component)) {
      fail(`Item ${i}: invalid component "${item.component}".`);
    }
    if (typeof item.units !== "number" || item.units < 0) {
      fail(`Item ${i}: units must be a non-negative number.`);
    }
  }

  const ops = items.map((item) => ({
    updateOne: {
      filter: { hospital: hospitalId, bloodGroup: item.bloodGroup, component: item.component },
      update: { $set: { units: item.units, updatedBy: userId } },
      upsert: true,
    },
  }));

  await BloodInventory.bulkWrite(ops);

  // Return the full updated inventory so the caller sees the final state
  return getInventory(hospitalId);
}

/**
 * Increment or decrement a single inventory cell.
 *
 * Used by the donation auto-update to add units after a confirmed donation.
 * Returns null if the adjustment would push units below zero.
 *
 * @param {string} hospitalId  The hospital's User _id
 * @param {string} bloodGroup  One of BLOOD_GROUPS
 * @param {string} component   One of COMPONENT_CODES
 * @param {number} delta       Positive to add, negative to subtract
 * @returns {Promise<object|null>}  The updated row, or null if blocked
 */
async function adjustUnits(hospitalId, bloodGroup, component, delta) {
  // Adding stock (delta >= 0): there is no "below zero" risk, so create the
  // (hospital, bloodGroup, component) row if it does not exist yet. Without
  // this upsert, a confirmed donation at a hospital whose inventory was never
  // initialised silently updated nothing.
  if (delta >= 0) {
    return BloodInventory.findOneAndUpdate(
      { hospital: hospitalId, bloodGroup, component },
      { $inc: { units: delta }, $setOnInsert: { updatedBy: hospitalId } },
      { new: true, upsert: true }
    );
  }

  // Removing stock: only proceed if a row exists and it won't go negative.
  const result = await BloodInventory.findOneAndUpdate(
    {
      hospital: hospitalId,
      bloodGroup,
      component,
      units: { $gte: -delta }, // only proceed if result >= 0
    },
    {
      $inc: { units: delta },
    },
    { new: true }
  );

  return result; // null means the adjustment would have gone negative
}

/**
 * Creates the full 32-row default inventory (8 blood groups × 4 components)
 * for a hospital. All units start at 0. Silently skips rows that already exist.
 *
 * @param {string} hospitalId  The hospital's User _id
 * @param {string} userId      The user triggering initialization
 * @returns {Promise<object[]>  The complete inventory after initialization
 */
async function initializeDefaultInventory(hospitalId, userId) {
  const ops = [];

  for (const bloodGroup of BLOOD_GROUPS) {
    for (const component of COMPONENT_CODES) {
      ops.push({
        updateOne: {
          filter: { hospital: hospitalId, bloodGroup, component },
          update: {
            $setOnInsert: { units: 0, updatedBy: userId },
          },
          upsert: true,
        },
      });
    }
  }

  await BloodInventory.bulkWrite(ops);
  return getInventory(hospitalId);
}

module.exports = {
  getInventory,
  upsertInventory,
  adjustUnits,
  initializeDefaultInventory,
};
