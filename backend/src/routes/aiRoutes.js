/**
 * AI Routes — minimal coordination endpoint.
 *
 * Temporary: matching, eligibility, and geo inputs arrive from the client
 * because Arefa's real agents are still under development. Once those
 * agents are ready, the orchestrator will call them server-side and
 * the client-supplied fields will be ignored.
 */

const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const { coordinateBloodRequest } = require("../controllers/aiController");

router.use(verifyFirebaseToken);

router.post("/coordinate", coordinateBloodRequest);

module.exports = router;
