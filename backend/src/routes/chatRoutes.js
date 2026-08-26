/**
 * Chat Routes — single endpoint for the BloodDrop chatbot.
 *
 * Requires Firebase auth so the chatbot can scope results to the
 * requesting user's ID and role per the CLAUDE.md specification.
 * The endpoint is read-only and performs no BloodDrop state changes.
 */

const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const { handleChat } = require("../controllers/chatController");

router.post("/", verifyFirebaseToken, handleChat);

module.exports = router;
