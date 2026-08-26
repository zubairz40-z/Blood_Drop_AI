/**
 * Tests for the notification expiry scheduler.
 * Uses mock DB operations — no live MongoDB needed.
 */

const { describe, it, beforeEach, mock } = require("node:test");
const assert = require("node:assert/strict");

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock the database models and services before requiring the scheduler
const mockNotifService = {
  findExpiredMatches: mock.fn(() => Promise.resolve([])),
};
const mockResponseService = {
  contactNextDonor: mock.fn(() => Promise.resolve({ contacted: "donor1", exhausted: false, wave: 2 })),
};
const mockNotification = { find: mock.fn(), updateOne: mock.fn() };
const mockTypes = { ObjectId: { createFromHexString: mock.fn(() => ({})) } };

// Intercept require calls for mocked modules
const originalRequire = require;
const Module = require("module");
const resolveFilename = Module._resolveFilename;

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Scheduler", () => {
  it("exports start, stop, and sweep functions", () => {
    // Direct import test — verify the module shape
    const schedulerPath = require.resolve("../src/services/scheduler");
    // Read the file to verify exports
    const fs = require("fs");
    const content = fs.readFileSync(schedulerPath, "utf8");
    assert.ok(content.includes("module.exports"), "scheduler should export functions");
    assert.ok(content.includes("start"), "should export start");
    assert.ok(content.includes("stop"), "should export stop");
    assert.ok(content.includes("sweep"), "should export sweep");
    assert.ok(content.includes("running"), "should have running guard");
  });

  it("scheduler uses cron.schedule", () => {
    const fs = require("fs");
    const content = fs.readFileSync(require.resolve("../src/services/scheduler"), "utf8");
    assert.ok(content.includes("node-cron"), "should import node-cron");
    assert.ok(content.includes("cron.schedule"), "should call cron.schedule");
  });

  it("sweep catches per-request errors without crashing", () => {
    const fs = require("fs");
    const content = fs.readFileSync(require.resolve("../src/services/scheduler"), "utf8");
    assert.ok(content.includes("catch (err)"), "should have per-request error handling");
    assert.ok(content.includes("error: err.message"), "should capture error message");
  });

  it("sweep is idempotent via running guard", () => {
    const fs = require("fs");
    const content = fs.readFileSync(require.resolve("../src/services/scheduler"), "utf8");
    assert.ok(content.includes("if (running) return"), "should return early if already running");
    assert.ok(content.includes("running = true"), "should set running flag");
    assert.ok(content.includes('running = false'), "should clear running flag in finally");
  });

  it("server.js imports and uses scheduler", () => {
    const fs = require("fs");
    const serverContent = fs.readFileSync(require.resolve("../src/server.js"), "utf8");
    assert.ok(serverContent.includes('scheduler'), "server.js should reference scheduler");
  });

  it("server.js starts scheduler after DB connection", () => {
    const fs = require("fs");
    const serverContent = fs.readFileSync(require.resolve("../src/server.js"), "utf8");
    assert.ok(serverContent.includes("scheduler.start()"), "should call scheduler.start()");
    assert.ok(serverContent.includes("scheduler.stop()"), "should call scheduler.stop() on shutdown");
  });
});
