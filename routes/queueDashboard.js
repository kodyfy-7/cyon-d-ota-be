require("dotenv").config();
const express = require("express");
const expressBasicAuth = require("express-basic-auth");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const { createBullBoard } = require("@bull-board/api");
const { ExpressAdapter } = require("@bull-board/express");
const { eventQueue } = require("../app/queues");

const router = express.Router();
const REDIS_ENABLED = process.env.REDIS_ENABLED === "true";

// Create Bull Board Express Adapter
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

const isLikelyBullQueue = (queue) =>
  queue && typeof queue.add === "function" && typeof queue.process === "function" && typeof queue.pause === "function";

if (REDIS_ENABLED && isLikelyBullQueue(eventQueue)) {
  createBullBoard({
    queues: [new BullAdapter(eventQueue)],
    serverAdapter,
  });
} else {
  router.get("/admin/queues", (req, res) => {
    return res.status(503).json({
      success: false,
      message: "Queue dashboard is disabled because Redis/Bull is not enabled."
    });
  });
}

// Add basic auth
router.use(
  "/admin/queues",
  expressBasicAuth({
    users: { admin: process.env.QUEUE_KEY },
    challenge: true,
  }),
  serverAdapter.getRouter()
);

module.exports = router;
