import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AccessTokenPayload {
  userId: string;
  workspaceId: string;
}

/**
 * Verifies the Bearer access token and attaches userId + workspaceId to req.
 * Used on every protected route that needs to scope queries by workspace.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No access token provided" });
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_ACCESS_TOKEN;
  if (!secret) {
    throw new Error("JWT_ACCESS_TOKEN not set");
  }

  try {
    const payload = jwt.verify(token, secret) as AccessTokenPayload;
    req.userId = payload.userId;
    req.workspaceId = payload.workspaceId;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Access token is invalid or expired" });
  }
}