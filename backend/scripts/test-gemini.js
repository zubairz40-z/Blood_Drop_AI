/**
 * Quick connection test — verifies Gemini service can reach the API.
 *
 * Usage:  node scripts/test-gemini.js
 * Requires GEMINI_API_KEY in backend/.env
 */

require("dotenv").config();
const { generateGeminiText } = require("../src/services/geminiService");

async function main() {
  try {
    const text = await generateGeminiText(
      "Reply only with: BloodDrop AI connected"
    );
    console.log(text);
    process.exit(0);
  } catch (err) {
    console.error("Gemini connection test failed:", err.message);
    process.exit(1);
  }
}

main();
