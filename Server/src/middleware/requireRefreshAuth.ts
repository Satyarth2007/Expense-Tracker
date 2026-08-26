import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { redis } from "../config/redis.js";

interface RefreshTokenPayload {
  userId: string;
  jti: string;
}

export async function requireRefreshAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  const secret = process.env.JWT_REFRESH_TOKEN;
  if (!secret) {
    return res.status(500).json({ error: "Refresh token configuration is missing" });
  }

  try {
    const payload = jwt.verify(token, secret) as RefreshTokenPayload;
    const storedUserId = await redis.get(`refresh:${payload.jti}`);

    if (!storedUserId || storedUserId !== payload.userId) {
      return res.status(401).json({ error: "Refresh token is invalid or revoked" });
    }

    req.refreshAuth = { userId: payload.userId, jti: payload.jti };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
}