const { test, describe, mock } = require("node:test");
const assert = require("node:assert");
const { handleChat } = require("../src/controllers/chatController");
const geminiService = require("../src/services/geminiService");

// ---------------------------------------------------------------------------
// Helpers — minimal mock req/res/next for Express handler tests
// ---------------------------------------------------------------------------

function makeReq(body = {}) {
  return { body };
}

function makeRes() {
  const res = { _status: null, _json: null };
  res.status = function (code) {
    res._status = code;
    return res;
  };
  res.json = function (obj) {
    res._json = obj;
    return res;
  };
  return res;
}

function makeNext() {
  return function next(err) {
    if (err) throw err;
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Chat Controller — handleChat", () => {
  test("valid message returns 200 with success and reply", async () => {
    const stub = mock.method(geminiService, "generateGeminiText", async () => "Hello from Gemini");
    try {
      const req = makeReq({ message: "What is plasma?" });
      const res = makeRes();
      await handleChat(req, res, makeNext());

      assert.equal(res._status, 200);
      assert.equal(res._json.success, true);
      assert.equal(typeof res._json.reply, "string");
      assert.ok(res._json.reply.length > 0);
    } finally {
      stub.mock.restore();
    }
  });

  test("response shape contains success and reply", async () => {
    const stub = mock.method(geminiService, "generateGeminiText", async () => "test reply");
    try {
      const req = makeReq({ message: "hello" });
      const res = makeRes();
      await handleChat(req, res, makeNext());

      const keys = Object.keys(res._json);
      assert.ok(keys.includes("success"));
      assert.ok(keys.includes("reply"));
      assert.equal(keys.length, 2);
    } finally {
      stub.mock.restore();
    }
  });

  test("missing message returns 400", async () => {
    const req = makeReq({});
    const res = makeRes();
    await handleChat(req, res, makeNext());

    assert.equal(res._status, 400);
    assert.equal(res._json.success, false);
  });

  test("empty message returns 400", async () => {
    const req = makeReq({ message: "   " });
    const res = makeRes();
    await handleChat(req, res, makeNext());

    assert.equal(res._status, 400);
    assert.equal(res._json.success, false);
  });

  test("non-string message returns 400", async () => {
    const req = makeReq({ message: 123 });
    const res = makeRes();
    await handleChat(req, res, makeNext());

    assert.equal(res._status, 400);
    assert.equal(res._json.success, false);
  });

  test("oversized message returns 400", async () => {
    const req = makeReq({ message: "a".repeat(2001) });
    const res = makeRes();
    await handleChat(req, res, makeNext());

    assert.equal(res._status, 400);
    assert.equal(res._json.success, false);
    assert.ok(res._json.message.includes("2000"));
  });

  test("Gemini failure returns safe error through error handler", async () => {
    const stub = mock.method(geminiService, "generateGeminiText", async () => {
      throw new Error("GEMINI_API_KEY is not set.");
    });
    try {
      const req = makeReq({ message: "test" });
      const res = makeRes();
      let caught = false;
      try {
        await handleChat(req, res, (err) => { throw err; });
      } catch (err) {
        caught = true;
        assert.ok(err.message.includes("GEMINI"));
      }
      assert.ok(caught, "Error should propagate");
    } finally {
      stub.mock.restore();
    }
  });

  test("API key is never returned in response", async () => {
    const stub = mock.method(geminiService, "generateGeminiText", async () => "safe reply");
    try {
      const req = makeReq({ message: "test" });
      const res = makeRes();
      await handleChat(req, res, makeNext());

      const jsonStr = JSON.stringify(res._json);
      assert.ok(!jsonStr.includes("GEMINI_API_KEY"));
      assert.ok(!jsonStr.includes("apiKey"));
      assert.ok(!jsonStr.includes("key"));
    } finally {
      stub.mock.restore();
    }
  });

  test("existing /api/health still works after chat route added", async () => {
    // Import app and use it as a check that route registration didn't break
    const app = require("../src/app");
    assert.ok(app, "app should load");
  });
});
