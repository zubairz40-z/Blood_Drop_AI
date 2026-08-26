/**
 * Chat Routes — single endpoint for the BloodDrop chatbot.
 *
 * Public — no auth required. The chatbot is a read-only general-purpose
 * assistant for BloodDrop guidance. It does NOT access user-specific
 * data, perform eligibility checks, or make BloodDrop state changes.
 */

const express = require("express");
const router = express.Router();
const { handleChat } = require("../controllers/chatController");

router.post("/", handleChat);

module.exports = router;
