require("dotenv").config();

const REDIS_ENABLED = process.env.REDIS_ENABLED === "true";

const createNoopQueue = () => ({
  add: async () => null,
  process: () => null,
  getRepeatableJobs: async () => [],
  removeRepeatableByKey: async () => null
});

let redisClient = null;
let eventQueue = createNoopQueue();
let birthdayQueue = createNoopQueue();

if (REDIS_ENABLED) {
  const Bull = require("bull");
  const Redis = require("ioredis");

  redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    tls: false,
    connectTimeOut: 10000
  });

  const bullRedisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    tls: false,
    connectTimeOut: 10000
  });

  bullRedisClient.on("connect", () => {
    console.log("Redis connection established for Bull");
  });

  bullRedisClient.on("error", (err) => {
    console.error("Redis connection error:", err.message);
  });

  eventQueue = new Bull("event", { redis: bullRedisClient });
  birthdayQueue = new Bull("birthday-reminder", { redis: bullRedisClient });
}

module.exports = {
  redisClient,
  eventQueue,
  birthdayQueue
};