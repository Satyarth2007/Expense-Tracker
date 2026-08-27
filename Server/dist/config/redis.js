import { Redis } from "ioredis";
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
//# sourceMappingURL=redis.js.map