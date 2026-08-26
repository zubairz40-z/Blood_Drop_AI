const inventoryService = require("../services/inventoryService");

/** GET /api/inventory — hospital sees its own inventory rows */
async function getInventory(req, res, next) {
  try {
    const inventory = await inventoryService.getInventory(req.currentUser._id);
    res.json({ success: true, inventory });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/inventory — hospital bulk-updates its own inventory */
async function upsertInventory(req, res, next) {
  try {
    const { items } = req.body;

    if (!items) {
      return res.status(400).json({
        success: false,
        message: "items array is required.",
      });
    }

    const inventory = await inventoryService.upsertInventory(
      req.currentUser._id,
      items,
      req.currentUser._id
    );

    res.json({ success: true, inventory });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/inventory/adjust — increment/decrement a single cell */
async function adjustUnits(req, res, next) {
  try {
    const { bloodGroup, component, delta } = req.body;

    if (!bloodGroup || !component || typeof delta !== "number") {
      return res.status(400).json({
        success: false,
        message: "bloodGroup, component, and numeric delta are required.",
      });
    }

    const updated = await inventoryService.adjustUnits(
      req.currentUser._id,
      bloodGroup,
      component,
      delta
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "Adjustment would result in negative units.",
      });
    }

    res.json({ success: true, inventory: updated });
  } catch (err) {
    next(err);
  }
}

/** POST /api/inventory/initialize — create default 32-row inventory */
async function initializeDefaultInventory(req, res, next) {
  try {
    const inventory = await inventoryService.initializeDefaultInventory(
      req.currentUser._id,
      req.currentUser._id
    );

    res.status(201).json({ success: true, inventory });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInventory,
  upsertInventory,
  adjustUnits,
  initializeDefaultInventory,
};
