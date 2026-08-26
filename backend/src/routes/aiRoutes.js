/**
 * AI Routes — minimal coordination endpoint.
 *
 * Only hospital and admin roles can invoke the AI orchestrator,
 * since it runs real matching, eligibility, and geo agents against
 * the database.
 */

const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const { coordinateBloodRequest } = require("../controllers/aiController");

router.use(verifyFirebaseToken);

router.post("/coordinate", authorizeRoles("hospital", "admin"), coordinateBloodRequest);

module.exports = router;
