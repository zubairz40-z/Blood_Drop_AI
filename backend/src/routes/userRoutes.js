const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const { updateMe } = require("../controllers/userController");

router.patch("/me", verifyFirebaseToken, updateMe);

module.exports = router;