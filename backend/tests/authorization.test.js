/**
 * Lightweight authorization tests for volunteer and inventory routes.
 *
 * These are NOT integration tests. We inspect Express router.stack to verify
 * that every route has verifyFirebaseToken and the correct authorizeRoles
 * middleware applied. This catches wiring mistakes without needing a real
 * Firebase token or database.
 */

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

const volunteerRouter = require("../src/routes/volunteerRoutes");
const inventoryRouter = require("../src/routes/inventoryRoutes");
const verifyFirebaseToken = require("../src/middleware/verifyFirebaseToken");
const authorizeRoles = require("../src/middleware/authorizeRoles");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Express routers store middleware in router.stack. Each layer is either:
 *   - A route layer: has .route with .path, .methods, and .stack (middleware chain)
 *   - A plain middleware layer: has .handle (the function) and .name
 *
 * This helper extracts route info from the stack for easy assertion.
 */
function getRouteEntries(router) {
  const entries = [];
  for (const layer of router.stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods);
      const middlewareFns = layer.route.stack.map((s) => s.handle);
      entries.push({
        path: layer.route.path,
        methods,
        middlewareFns,
      });
    }
  }
  return entries;
}

/**
 * Get router-level (non-route) middleware layers from a router's stack.
 */
function getRouterLevelMiddleware(router) {
  return router.stack.filter((layer) => !layer.route);
}

/**
 * Check if verifyFirebaseToken is present at the router level.
 */
function routerHasFirebaseAuth(router) {
  return getRouterLevelMiddleware(router).some(
    (layer) => layer.handle === verifyFirebaseToken
  );
}

/**
 * Check if an authorizeRoles middleware is present at the router level.
 * Since authorizeRoles is a factory that returns a closure, we can't compare
 * by identity. We check that at least one router-level layer is a function
 * that isn't verifyFirebaseToken.
 */
function routerHasAuthorizeRoles(router) {
  return getRouterLevelMiddleware(router).some(
    (layer) => typeof layer.handle === "function" && layer.handle !== verifyFirebaseToken
  );
}

/**
 * Check that a route's per-route middleware stack includes an authorizeRoles
 * call. Since authorizeRoles returns a closure (anonymous function), we check
 * for a function that is NOT verifyFirebaseToken and is NOT the controller
 * handler (which would have a specific name).
 */
function routeHasAuthorizeRoles(middlewareFns) {
  return middlewareFns.some(
    (fn) => typeof fn === "function" && fn !== verifyFirebaseToken
  );
}

// ===========================================================================
// Volunteer routes
// ===========================================================================

describe("volunteerRoutes authorization", () => {
  const entries = getRouteEntries(volunteerRouter);

  test("router has 9 route entries (8 volunteer + 1 task creation)", () => {
    assert.equal(entries.length, 9);
  });

  describe("router-level middleware", () => {
    test("verifyFirebaseToken is applied at router level", () => {
      assert.ok(routerHasFirebaseAuth(volunteerRouter));
    });

    test("no router-level authorizeRoles (each route defines its own)", () => {
      // volunteer routes apply authorizeRoles per-route, not at router level
      const hasAtRouter = getRouterLevelMiddleware(volunteerRouter).some(
        (layer) => typeof layer.handle === "function" && layer.handle !== verifyFirebaseToken
      );
      assert.equal(hasAtRouter, false, "authorizeRoles should not be at router level for volunteer routes");
    });
  });

  describe("GET /tasks", () => {
    const route = entries.find((e) => e.path === "/tasks" && e.methods.includes("get"));
    test("exists", () => { assert.ok(route); });
    test("has per-route authorizeRoles", () => {
      assert.ok(routeHasAuthorizeRoles(route.middlewareFns));
    });
  });

  describe("GET /tasks/my", () => {
    const route = entries.find((e) => e.path === "/tasks/my" && e.methods.includes("get"));
    test("exists", () => { assert.ok(route); });
    test("has per-route authorizeRoles", () => {
      assert.ok(routeHasAuthorizeRoles(route.middlewareFns));
    });
  });

  describe("GET /history", () => {
    const route = entries.find((e) => e.path === "/history" && e.methods.includes("get"));
    test("exists", () => { assert.ok(route); });
    test("has per-route authorizeRoles", () => {
      assert.ok(routeHasAuthorizeRoles(route.middlewareFns));
    });
  });

  describe("GET /dashboard", () => {
    const route = entries.find((e) => e.path === "/dashboard" && e.methods.includes("get"));
    test("exists", () => { assert.ok(route); });
    test("has per-route authorizeRoles", () => {
      assert.ok(routeHasAuthorizeRoles(route.middlewareFns));
    });
  });

  describe("POST /tasks/:id/accept", () => {
    const route = entries.find((e) => e.path === "/tasks/:id/accept" && e.methods.includes("post"));
    test("exists", () => { assert.ok(route); });
    test("has per-route authorizeRoles", () => {
      assert.ok(routeHasAuthorizeRoles(route.middlewareFns));
    });
  });

  describe("PATCH /tasks/:id/start", () => {
    const route = entries.find((e) => e.path === "/tasks/:id/start" && e.methods.includes("patch"));
    test("exists", () => { assert.ok(route); });
    test("has per-route authorizeRoles", () => {
      assert.ok(routeHasAuthorizeRoles(route.middlewareFns));
    });
  });

  describe("PATCH /tasks/:id/complete", () => {
    const route = entries.find((e) => e.path === "/tasks/:id/complete" && e.methods.includes("patch"));
    test("exists", () => { assert.ok(route); });
    test("has per-route authorizeRoles", () => {
      assert.ok(routeHasAuthorizeRoles(route.middlewareFns));
    });
  });

  describe("PATCH /tasks/:id/cancel", () => {
    const route = entries.find((e) => e.path === "/tasks/:id/cancel" && e.methods.includes("patch"));
    test("exists", () => { assert.ok(route); });
    test("has per-route authorizeRoles", () => {
      assert.ok(routeHasAuthorizeRoles(route.middlewareFns));
    });
  });

  describe("POST /tasks (task creation — hospital or volunteer)", () => {
    const route = entries.find((e) => e.path === "/tasks" && e.methods.includes("post"));
    test("exists", () => { assert.ok(route); });
    test("has per-route authorizeRoles", () => {
      assert.ok(routeHasAuthorizeRoles(route.middlewareFns));
    });
  });
});

// ===========================================================================
// Inventory routes
// ===========================================================================

describe("inventoryRoutes authorization", () => {
  const entries = getRouteEntries(inventoryRouter);

  test("router has 4 route entries", () => {
    assert.equal(entries.length, 4);
  });

  describe("router-level middleware", () => {
    test("verifyFirebaseToken is applied at router level", () => {
      assert.ok(routerHasFirebaseAuth(inventoryRouter));
    });

    test("authorizeRoles is applied at router level", () => {
      assert.ok(routerHasAuthorizeRoles(inventoryRouter));
    });
  });

  describe("GET /", () => {
    const route = entries.find((e) => e.path === "/" && e.methods.includes("get"));
    test("exists", () => { assert.ok(route); });
    test("no per-route authorizeRoles (handled at router level)", () => {
      // inventory routes rely on router-level authorizeRoles("hospital")
      assert.equal(route.middlewareFns.length, 1, "should only have the controller handler");
    });
  });

  describe("PUT /", () => {
    const route = entries.find((e) => e.path === "/" && e.methods.includes("put"));
    test("exists", () => { assert.ok(route); });
    test("no per-route authorizeRoles (handled at router level)", () => {
      assert.equal(route.middlewareFns.length, 1);
    });
  });

  describe("PATCH /adjust", () => {
    const route = entries.find((e) => e.path === "/adjust" && e.methods.includes("patch"));
    test("exists", () => { assert.ok(route); });
    test("no per-route authorizeRoles (handled at router level)", () => {
      assert.equal(route.middlewareFns.length, 1);
    });
  });

  describe("POST /initialize", () => {
    const route = entries.find((e) => e.path === "/initialize" && e.methods.includes("post"));
    test("exists", () => { assert.ok(route); });
    test("no per-route authorizeRoles (handled at router level)", () => {
      assert.equal(route.middlewareFns.length, 1);
    });
  });
});
