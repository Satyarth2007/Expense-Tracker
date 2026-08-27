import jwt from "jsonwebtoken";
import { redis } from "../config/redis.js";
export async function requireRefreshAuth(req, res, next) {
    const token = req.cookies?.refreshToken;
    if (!token) {
        return res.status(401).json({ error: "No refresh token provided" });
    }
    const secret = process.env.JWT_REFRESH_TOKEN;
    if (!secret) {
        return res.status(500).json({ error: "Refresh token configuration is missing" });
    }
    try {
        const payload = jwt.verify(token, secret);
        const storedUserId = await redis.get(`refresh:${payload.jti}`);
        if (!storedUserId || storedUserId !== payload.userId) {
            return res.status(401).json({ error: "Refresh token is invalid or revoked" });
        }
        req.refreshAuth = { userId: payload.userId, jti: payload.jti };
        return next();
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
}
//# sourceMappingURL=requireRefreshAuth.js.map