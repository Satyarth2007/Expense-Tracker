import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL not set");
}

export const bullmqConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

bullmqConnection.on("connect", () => {
  console.log("BullMQ Redis connection established");
});

bullmqConnection.on("error", (err) => {
  console.error("BullMQ Redis connection error:", err);
});