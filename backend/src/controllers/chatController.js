/**
 * Chat Controller — proxies user messages to Gemini via geminiService.
 *
 * The chatbot is a general-purpose assistant for BloodDrop platform
 * guidance. It does NOT perform any BloodDrop business decisions —
 * eligibility, compatibility, matching, and status transitions remain
 * in deterministic Node.js services.
 */

const geminiService = require("../services/geminiService");

// Maximum allowed message length (characters)
const MAX_MESSAGE_LENGTH = 2000;

// ---------------------------------------------------------------------------
// BloodDrop chatbot system context
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are BloodDrop AI, the conversational assistant for a blood and blood-component donation coordination platform.

You may help users with:
- how BloodDrop works
- blood donation concepts (Whole Blood, Plasma, Platelets, Double Red Cells)
- general donor preparation information
- understanding request statuses
- understanding BloodDrop features
- general blood donation education
- explaining the five-agent coordination architecture at a user-friendly level

Rules:
- Provide concise, helpful answers.
- Do not claim to replace a doctor or medical professional.
- Do not diagnose diseases or provide unsafe medical instructions.
- Do not claim a donor is medically eligible based only on conversation.
- BloodDrop's deterministic eligibility system is the source of truth for donation eligibility.
- Do not invent patient records, donor records, or private user information.
- Do not claim actions were performed unless the application actually performed them.
- For medical emergencies, advise the user to contact appropriate local emergency or medical services.`;

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

/**
 * POST /api/chat
 *
 * Accepts { message }, sends it to Gemini with the BloodDrop system
 * context, and returns the model's text reply.
 */
async function handleChat(req, res, next) {
  try {
    const { message } = req.body || {};

    // --- validate ---
    if (typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message must be a string.",
      });
    }

    const trimmed = message.trim();

    if (trimmed.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message must not be empty.",
      });
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Message exceeds the ${MAX_MESSAGE_LENGTH} character limit.`,
      });
    }

    // --- build prompt ---
    const prompt = `${SYSTEM_PROMPT}\n\nUser: ${trimmed}`;

    // --- call Gemini ---
    const reply = await geminiService.generateGeminiText(prompt);

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    return next(err);
  }
}

module.exports = { handleChat };
