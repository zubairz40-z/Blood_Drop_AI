/**
 * Gemini Service tests — validates input handling and error wrapping.
 * The real Gemini SDK is never called; we test the module's own logic.
 */

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

describe("geminiService — input validation", () => {
  test("non-string prompt throws 'Prompt must be a string'", async () => {
    const geminiService = require("../src/services/geminiService");
    await assert.rejects(
      () => geminiService.generateGeminiText(123),
      (err) => {
        assert.match(err.message, /Prompt must be a string/);
        return true;
      }
    );
  });

  test("null prompt throws 'Prompt must be a string'", async () => {
    const geminiService = require("../src/services/geminiService");
    await assert.rejects(
      () => geminiService.generateGeminiText(null),
      (err) => {
        assert.match(err.message, /Prompt must be a string/);
        return true;
      }
    );
  });

  test("undefined prompt throws 'Prompt must be a string'", async () => {
    const geminiService = require("../src/services/geminiService");
    await assert.rejects(
      () => geminiService.generateGeminiText(undefined),
      (err) => {
        assert.match(err.message, /Prompt must be a string/);
        return true;
      }
    );
  });

  test("empty string prompt throws 'must not be empty'", async () => {
    const geminiService = require("../src/services/geminiService");
    await assert.rejects(
      () => geminiService.generateGeminiText(""),
      (err) => {
        assert.match(err.message, /must not be empty/);
        return true;
      }
    );
  });

  test("whitespace-only prompt throws 'must not be empty'", async () => {
    const geminiService = require("../src/services/geminiService");
    await assert.rejects(
      () => geminiService.generateGeminiText("   \t\n  "),
      (err) => {
        assert.match(err.message, /must not be empty/);
        return true;
      }
    );
  });

  test("array prompt throws 'Prompt must be a string'", async () => {
    const geminiService = require("../src/services/geminiService");
    await assert.rejects(
      () => geminiService.generateGeminiText(["hello"]),
      (err) => {
        assert.match(err.message, /Prompt must be a string/);
        return true;
      }
    );
  });

  test("object prompt throws 'Prompt must be a string'", async () => {
    const geminiService = require("../src/services/geminiService");
    await assert.rejects(
      () => geminiService.generateGeminiText({ text: "hello" }),
      (err) => {
        assert.match(err.message, /Prompt must be a string/);
        return true;
      }
    );
  });
});

describe("geminiService — module exports", () => {
  test("exports generateGeminiText as a function", () => {
    const geminiService = require("../src/services/geminiService");
    assert.equal(typeof geminiService.generateGeminiText, "function");
  });

  test("module has no other exports (thin wrapper)", () => {
    const geminiService = require("../src/services/geminiService");
    const keys = Object.keys(geminiService);
    assert.deepEqual(keys, ["generateGeminiText"]);
  });
});
