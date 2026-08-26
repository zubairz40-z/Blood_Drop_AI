const { describe, test, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const VolunteerTask = require("../src/models/VolunteerTask");
const volunteerService = require("../src/services/volunteerService");

// ---------------------------------------------------------------------------
// Helpers — build a fake Mongoose chainable query object
// ---------------------------------------------------------------------------

function makeChain(result) {
  const chain = {};
  chain.sort = mock.fn(() => chain);
  chain.populate = mock.fn(() => chain);
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  chain[Symbol.toStringTag] = "Promise";
  return chain;
}

function makeFakeTask(overrides = {}) {
  return {
    _id: "6650f1a2b2c3d4e5f6a7b8c9",
    request: "req-1",
    volunteer: "vol-1",
    hospital: "hosp-1",
    donor: null,
    title: "Transport donor to hospital",
    description: "Pickup from Mirpur",
    type: "TRANSPORT",
    status: "OPEN",
    urgency: "ROUTINE",
    address: "123 Main St",
    location: { type: "Point", coordinates: [90.41, 23.81] },
    assignedAt: null,
    startedAt: null,
    completedAt: null,
    save: mock.fn(async function () { return this; }),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock storage
// ---------------------------------------------------------------------------

let mocks = [];

function addMock(target, method, impl) {
  const m = mock.method(target, method, impl);
  mocks.push(m);
  return m;
}

function teardown() {
  for (const m of mocks) m.mock.restore();
  mocks = [];
}

// ===========================================================================
// Tests
// ===========================================================================

describe("volunteerService", () => {
  afterEach(teardown);

  // -------------------------------------------------------------------------
  // listOpenTasks
  // -------------------------------------------------------------------------

  describe("listOpenTasks", () => {
    test("queries for status OPEN", async () => {
      const task = makeFakeTask();
      const chain = makeChain([task]);
      addMock(VolunteerTask, "find", mock.fn(() => chain));

      await volunteerService.listOpenTasks();

      const findArgs = VolunteerTask.find.mock.calls[0].arguments[0];
      assert.equal(findArgs.status, "OPEN");
    });

    test("adds urgency filter when provided", async () => {
      const chain = makeChain([]);
      addMock(VolunteerTask, "find", mock.fn(() => chain));

      await volunteerService.listOpenTasks({ urgency: "EMERGENCY" });

      const findArgs = VolunteerTask.find.mock.calls[0].arguments[0];
      assert.equal(findArgs.urgency, "EMERGENCY");
    });

    test("adds type filter when provided", async () => {
      const chain = makeChain([]);
      addMock(VolunteerTask, "find", mock.fn(() => chain));

      await volunteerService.listOpenTasks({ type: "GUIDE" });

      const findArgs = VolunteerTask.find.mock.calls[0].arguments[0];
      assert.equal(findArgs.type, "GUIDE");
    });

    test("chains sort and two populate calls", async () => {
      const chain = makeChain([]);
      addMock(VolunteerTask, "find", mock.fn(() => chain));

      await volunteerService.listOpenTasks();

      assert.equal(chain.sort.mock.callCount(), 1);
      assert.equal(chain.populate.mock.callCount(), 2);
    });

    test("returns the chain result", async () => {
      const task = makeFakeTask({ status: "OPEN" });
      const chain = makeChain([task]);
      addMock(VolunteerTask, "find", mock.fn(() => chain));

      const result = await volunteerService.listOpenTasks();
      assert.equal(result.length, 1);
      assert.equal(result[0].status, "OPEN");
    });

    test("deterministic — same filters produce same query", async () => {
      const chain = makeChain([]);
      addMock(VolunteerTask, "find", mock.fn(() => chain));

      await volunteerService.listOpenTasks({ urgency: "URGENT", type: "ESCORT" });
      const q1 = { ...VolunteerTask.find.mock.calls[0].arguments[0] };

      teardown();
      const chain2 = makeChain([]);
      addMock(VolunteerTask, "find", mock.fn(() => chain2));

      await volunteerService.listOpenTasks({ urgency: "URGENT", type: "ESCORT" });
      const q2 = { ...VolunteerTask.find.mock.calls[0].arguments[0] };

      assert.deepEqual(q1, q2);
    });
  });

  // -------------------------------------------------------------------------
  // getMyTasks
  // -------------------------------------------------------------------------

  describe("getMyTasks", () => {
    test("queries by volunteer and active statuses", async () => {
      const chain = makeChain([]);
      addMock(VolunteerTask, "find", mock.fn(() => chain));

      await volunteerService.getMyTasks("vol-42");

      const q = VolunteerTask.find.mock.calls[0].arguments[0];
      assert.equal(q.volunteer, "vol-42");
      assert.deepEqual(q.status, { $in: ["ASSIGNED", "IN_PROGRESS"] });
    });

    test("chains sort and three populate calls", async () => {
      const chain = makeChain([]);
      addMock(VolunteerTask, "find", mock.fn(() => chain));

      await volunteerService.getMyTasks("vol-1");

      assert.equal(chain.sort.mock.callCount(), 1);
      assert.equal(chain.populate.mock.callCount(), 3);
    });

    test("returns matching tasks", async () => {
      const task = makeFakeTask({ status: "ASSIGNED" });
      const chain = makeChain([task]);
      addMock(VolunteerTask, "find", mock.fn(() => chain));

      const result = await volunteerService.getMyTasks("vol-1");
      assert.equal(result.length, 1);
    });
  });

  // -------------------------------------------------------------------------
  // getHistory
  // -------------------------------------------------------------------------

  describe("getHistory", () => {
    test("queries by volunteer and terminal statuses", async () => {
      const chain = makeChain([]);
      addMock(VolunteerTask, "find", mock.fn(() => chain));

      await volunteerService.getHistory("vol-7");

      const q = VolunteerTask.find.mock.calls[0].arguments[0];
      assert.equal(q.volunteer, "vol-7");
      assert.deepEqual(q.status, { $in: ["COMPLETED", "CANCELLED"] });
    });

    test("chains sort and two populate calls", async () => {
      const chain = makeChain([]);
      addMock(VolunteerTask, "find", mock.fn(() => chain));

      await volunteerService.getHistory("vol-1");

      assert.equal(chain.sort.mock.callCount(), 1);
      assert.equal(chain.populate.mock.callCount(), 2);
    });

    test("returns completed and cancelled tasks", async () => {
      const c = makeFakeTask({ status: "COMPLETED" });
      const x = makeFakeTask({ _id: "aaa", status: "CANCELLED" });
      const chain = makeChain([c, x]);
      addMock(VolunteerTask, "find", mock.fn(() => chain));

      const result = await volunteerService.getHistory("vol-1");
      assert.equal(result.length, 2);
    });
  });

  // -------------------------------------------------------------------------
  // acceptTask
  // -------------------------------------------------------------------------

  describe("acceptTask", () => {
    test("calls findOneAndUpdate with OPEN condition", async () => {
      const updated = makeFakeTask({ status: "ASSIGNED" });
      addMock(VolunteerTask, "findOneAndUpdate", mock.fn(async () => updated));

      const result = await volunteerService.acceptTask("task-1", "vol-99");

      const args = VolunteerTask.findOneAndUpdate.mock.calls[0].arguments;
      assert.deepEqual(args[0], { _id: "task-1", status: "OPEN" });
      assert.equal(args[1].$set.volunteer, "vol-99");
      assert.equal(args[1].$set.status, "ASSIGNED");
      assert.equal(result.status, "ASSIGNED");
    });

    test("returns null when task is already taken", async () => {
      addMock(VolunteerTask, "findOneAndUpdate", mock.fn(async () => null));

      const result = await volunteerService.acceptTask("task-1", "vol-99");
      assert.equal(result, null);
    });

    test("sets assignedAt to a Date", async () => {
      const updated = makeFakeTask({ status: "ASSIGNED" });
      addMock(VolunteerTask, "findOneAndUpdate", mock.fn(async () => updated));

      await volunteerService.acceptTask("task-1", "vol-1");

      const setBlock = VolunteerTask.findOneAndUpdate.mock.calls[0].arguments[1].$set;
      assert.ok(setBlock.assignedAt instanceof Date);
    });

    test("passes { new: true } option", async () => {
      addMock(VolunteerTask, "findOneAndUpdate", mock.fn(async () => makeFakeTask()));

      await volunteerService.acceptTask("task-1", "vol-1");

      const opts = VolunteerTask.findOneAndUpdate.mock.calls[0].arguments[2];
      assert.deepEqual(opts, { new: true });
    });
  });

  // -------------------------------------------------------------------------
  // startTask
  // -------------------------------------------------------------------------

  describe("startTask", () => {
    test("transitions ASSIGNED to IN_PROGRESS", async () => {
      const updated = makeFakeTask({ status: "IN_PROGRESS" });
      addMock(VolunteerTask, "findOneAndUpdate", mock.fn(async () => updated));

      const result = await volunteerService.startTask("task-1", "vol-1");

      const q = VolunteerTask.findOneAndUpdate.mock.calls[0].arguments[0];
      assert.deepEqual(q, { _id: "task-1", volunteer: "vol-1", status: "ASSIGNED" });
      assert.equal(result.status, "IN_PROGRESS");
    });

    test("returns null on wrong status", async () => {
      addMock(VolunteerTask, "findOneAndUpdate", mock.fn(async () => null));

      const result = await volunteerService.startTask("task-1", "vol-1");
      assert.equal(result, null);
    });

    test("sets startedAt to a Date", async () => {
      addMock(VolunteerTask, "findOneAndUpdate", mock.fn(async () => makeFakeTask()));

      await volunteerService.startTask("task-1", "vol-1");

      const setBlock = VolunteerTask.findOneAndUpdate.mock.calls[0].arguments[1].$set;
      assert.ok(setBlock.startedAt instanceof Date);
    });
  });

  // -------------------------------------------------------------------------
  // completeTask
  // -------------------------------------------------------------------------

  describe("completeTask", () => {
    test("transitions IN_PROGRESS to COMPLETED", async () => {
      const updated = makeFakeTask({ status: "COMPLETED" });
      addMock(VolunteerTask, "findOneAndUpdate", mock.fn(async () => updated));

      const result = await volunteerService.completeTask("task-1", "vol-1");

      const q = VolunteerTask.findOneAndUpdate.mock.calls[0].arguments[0];
      assert.deepEqual(q, { _id: "task-1", volunteer: "vol-1", status: "IN_PROGRESS" });
      assert.equal(result.status, "COMPLETED");
    });

    test("returns null when volunteer does not match", async () => {
      addMock(VolunteerTask, "findOneAndUpdate", mock.fn(async () => null));

      const result = await volunteerService.completeTask("task-1", "wrong-vol");
      assert.equal(result, null);
    });

    test("sets completedAt to a Date", async () => {
      addMock(VolunteerTask, "findOneAndUpdate", mock.fn(async () => makeFakeTask()));

      await volunteerService.completeTask("task-1", "vol-1");

      const setBlock = VolunteerTask.findOneAndUpdate.mock.calls[0].arguments[1].$set;
      assert.ok(setBlock.completedAt instanceof Date);
    });
  });

  // -------------------------------------------------------------------------
  // cancelTask
  // -------------------------------------------------------------------------

  describe("cancelTask", () => {
    test("returns null when task not found", async () => {
      addMock(VolunteerTask, "findById", mock.fn(async () => null));

      const result = await volunteerService.cancelTask("task-x", "vol-1", "volunteer");
      assert.equal(result, null);
    });

    test("volunteer cancels own OPEN task", async () => {
      const task = makeFakeTask({ volunteer: "vol-1", status: "OPEN" });
      addMock(VolunteerTask, "findById", mock.fn(async () => task));

      const result = await volunteerService.cancelTask("task-1", "vol-1", "volunteer");
      assert.equal(result.status, "CANCELLED");
      assert.equal(task.save.mock.callCount(), 1);
    });

    test("volunteer cannot cancel another volunteer's task", async () => {
      const task = makeFakeTask({ volunteer: "vol-other", status: "OPEN" });
      addMock(VolunteerTask, "findById", mock.fn(async () => task));

      const result = await volunteerService.cancelTask("task-1", "vol-1", "volunteer");
      assert.equal(result, "FORBIDDEN");
      assert.equal(task.save.mock.callCount(), 0);
    });

    test("hospital role can cancel any task", async () => {
      const task = makeFakeTask({ volunteer: "vol-other", status: "ASSIGNED" });
      addMock(VolunteerTask, "findById", mock.fn(async () => task));

      const result = await volunteerService.cancelTask("task-1", "hosp-1", "hospital");
      assert.equal(result.status, "CANCELLED");
    });

    test("cannot cancel already COMPLETED task", async () => {
      const task = makeFakeTask({ volunteer: "vol-1", status: "COMPLETED" });
      addMock(VolunteerTask, "findById", mock.fn(async () => task));

      const result = await volunteerService.cancelTask("task-1", "vol-1", "volunteer");
      assert.equal(result, "ALREADY_DONE");
    });

    test("cannot cancel already CANCELLED task", async () => {
      const task = makeFakeTask({ volunteer: "vol-1", status: "CANCELLED" });
      addMock(VolunteerTask, "findById", mock.fn(async () => task));

      const result = await volunteerService.cancelTask("task-1", "vol-1", "volunteer");
      assert.equal(result, "ALREADY_DONE");
    });
  });

  // -------------------------------------------------------------------------
  // getDashboardStats
  // -------------------------------------------------------------------------

  describe("getDashboardStats", () => {
    test("returns counts for assigned, inProgress, completed, total", async () => {
      const counts = { ASSIGNED: 2, IN_PROGRESS: 1, COMPLETED: 5, TOTAL: 8 };
      addMock(VolunteerTask, "countDocuments", mock.fn(async (q) => {
        if (q.status === "ASSIGNED") return counts.ASSIGNED;
        if (q.status === "IN_PROGRESS") return counts.IN_PROGRESS;
        if (q.status === "COMPLETED") return counts.COMPLETED;
        return counts.TOTAL;
      }));

      const stats = await volunteerService.getDashboardStats("vol-1");

      assert.equal(stats.assigned, 2);
      assert.equal(stats.inProgress, 1);
      assert.equal(stats.completed, 5);
      assert.equal(stats.total, 8);
    });

    test("calls countDocuments four times", async () => {
      addMock(VolunteerTask, "countDocuments", mock.fn(async () => 0));

      await volunteerService.getDashboardStats("vol-1");

      assert.equal(VolunteerTask.countDocuments.mock.callCount(), 4);
    });

    test("all queries filter by the given volunteer", async () => {
      addMock(VolunteerTask, "countDocuments", mock.fn(async () => 0));

      await volunteerService.getDashboardStats("vol-42");

      for (const call of VolunteerTask.countDocuments.mock.calls) {
        assert.equal(call.arguments[0].volunteer, "vol-42");
      }
    });
  });

  // -------------------------------------------------------------------------
  // createTask
  // -------------------------------------------------------------------------

  describe("createTask", () => {
    test("calls VolunteerTask.create with provided fields", async () => {
      const created = makeFakeTask();
      addMock(VolunteerTask, "create", mock.fn(async () => created));

      await volunteerService.createTask({
        requestId: "req-1",
        hospitalId: "hosp-1",
        title: "Transport donor",
        description: "From Dhanmondi",
        type: "TRANSPORT",
        urgency: "URGENT",
        address: "123 Main St",
        location: { type: "Point", coordinates: [90.41, 23.81] },
      });

      const args = VolunteerTask.create.mock.calls[0].arguments[0];
      assert.equal(args.request, "req-1");
      assert.equal(args.hospital, "hosp-1");
      assert.equal(args.title, "Transport donor");
      assert.equal(args.description, "From Dhanmondi");
      assert.equal(args.type, "TRANSPORT");
      assert.equal(args.urgency, "URGENT");
      assert.equal(args.address, "123 Main St");
      assert.deepEqual(args.location, { type: "Point", coordinates: [90.41, 23.81] });
    });

    test("defaults type to TRANSPORT and urgency to ROUTINE", async () => {
      addMock(VolunteerTask, "create", mock.fn(async () => makeFakeTask()));

      await volunteerService.createTask({
        requestId: "req-2",
        hospitalId: "hosp-2",
        title: "Guide donor",
      });

      const args = VolunteerTask.create.mock.calls[0].arguments[0];
      assert.equal(args.type, "TRANSPORT");
      assert.equal(args.urgency, "ROUTINE");
    });

    test("returns the created task", async () => {
      const created = makeFakeTask({ _id: "new-id" });
      addMock(VolunteerTask, "create", mock.fn(async () => created));

      const result = await volunteerService.createTask({
        requestId: "req-1",
        hospitalId: "hosp-1",
        title: "Escort",
      });

      assert.equal(result._id, "new-id");
    });
  });
});
