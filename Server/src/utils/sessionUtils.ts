import { redis } from "../config/redis.js";

/**
 * Revokes every active refresh token session for a given user,
 * forcing re-login on all devices.
 */
export async function revokeAllSessions(userId: string) {
  const jtis = await redis.smembers(`user_sessions:${userId}`);
  if (jtis.length > 0) {
    const keys = jtis.map((jti) => `refresh:${jti}`);
    await redis.del(...keys);
  }
  await redis.del(`user_sessions:${userId}`);
}