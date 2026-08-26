import { Redis } from "ioredis";

// In TypeScript strict mode, this can fail if the Redis import is treated as a namespace or mismatched ESM type.
// The project expects a valid REDIS_URL environment variable before creating the client.
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL not set");
}

export const redis = new Redis(redisUrl);

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});