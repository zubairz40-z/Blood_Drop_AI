const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const { register, login, getMe } = require("../controllers/userController");

router.post("/register", verifyFirebaseToken, register);
router.post("/login", verifyFirebaseToken, login);
router.get("/me", verifyFirebaseToken, getMe);

module.exports = router;