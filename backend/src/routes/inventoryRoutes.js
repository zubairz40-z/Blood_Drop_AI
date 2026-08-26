const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const {
  getInventory,
  upsertInventory,
  adjustUnits,
  initializeDefaultInventory,
} = require("../controllers/inventoryController");

router.use(verifyFirebaseToken, authorizeRoles("hospital"));

router.get("/", getInventory);
router.put("/", upsertInventory);
router.patch("/adjust", adjustUnits);
router.post("/initialize", initializeDefaultInventory);

module.exports = router;
