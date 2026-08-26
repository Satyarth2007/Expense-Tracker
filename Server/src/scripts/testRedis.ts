import "dotenv/config";
import { redis } from "../config/redis.js";

async function main() {
  await redis.set("test-key", "hello from redis");
  const value = await redis.get("test-key");
  console.log("Value from Redis:", value);
  await redis.del("test-key");
  process.exit(0);
}

main().catch((err) => {
  console.error("Redis test failed:", err);
  process.exit(1);
});