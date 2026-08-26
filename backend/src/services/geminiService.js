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

  const response = await client.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

  // response.text is a getter that returns the text of the first candidate
  return response.text;
}

module.exports = { generateGeminiText };
