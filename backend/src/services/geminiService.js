/**
 * Gemini Service — thin wrapper around @google/genai for text generation.
 *
 * This module handles SDK initialization and a single reusable
 * text generation function. It does NOT contain any BloodDrop
 * business logic, database access, or agent orchestration.
 */

const { GoogleGenAI } = require("@google/genai");

// ---------------------------------------------------------------------------
// Lazy SDK initialization — avoids crashing at import time when the key
// is missing, but fails clearly when the function is actually called.
// ---------------------------------------------------------------------------

let genai = null;

/**
 * Returns a lazily-initialized GoogleGenAI instance.
 * Throws a readable error if GEMINI_API_KEY is not set.
 */
function getClient() {
  if (genai) return genai;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to backend/.env."
    );
  }

  genai = new GoogleGenAI({ apiKey });
  return genai;
}

// ---------------------------------------------------------------------------
// Text generation
// ---------------------------------------------------------------------------

/**
 * Sends a plain-text prompt to Gemini and returns the model's text response.
 *
 * @param {string} prompt — a non-empty text prompt
 * @returns {Promise<string>} — the model's response text
 * @throws {Error} if the prompt is invalid or the API call fails
 */
async function generateGeminiText(prompt) {
  // Validate input
  if (typeof prompt !== "string") {
    throw new Error("Prompt must be a string.");
  }
  if (prompt.trim().length === 0) {
    throw new Error("Prompt must not be empty or whitespace.");
  }

  const client = getClient();

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    // response.text is a getter that returns the text of the first candidate
    const text = response.text;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Gemini returned an empty response.");
    }
    return text;
  } catch (err) {
    // Wrap SDK/network errors into a safe, readable message.
    // Never expose API keys, SDK internals, or provider stack traces.
    const msg = err.message || String(err);
    if (
      msg.includes("API key") ||
      msg.includes("quota") ||
      msg.includes("rate limit") ||
      msg.includes("permission")
    ) {
      throw new Error("Gemini API access issue. Please try again shortly.");
    }
    if (msg.includes("timeout") || msg.includes("network")) {
      throw new Error("Gemini request timed out. Please try again.");
    }
    throw new Error("Gemini is temporarily unavailable.");
  }
}

module.exports = { generateGeminiText };
