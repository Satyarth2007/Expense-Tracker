import { Request, Response } from "express";
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import {registerSchema, loginSchema} from '../validators/authValidators.js'
import { pool } from "../config/db.js";
import bcrypt from 'bcrypt'
import { redis } from "../config/redis.js";

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function signAccessToken(userId: string, workspaceId: string) {
  const secret = process.env.JWT_ACCESS_TOKEN;
  if (!secret) {
    throw new Error("JWT_ACCESS_TOKEN not set");
  }
  return jwt.sign({ userId, workspaceId }, secret, { expiresIn: "15m" });
}

const USED_TOKEN_GRACE_SECONDS = 60; // window to detect reuse after rotation

async function signRefreshToken(userId: string) {
  const secret = process.env.JWT_REFRESH_TOKEN;
  if (!secret) {
    throw new Error("JWT_REFRESH_TOKEN not set");
  }

  const jti = crypto.randomUUID();
  const refreshToken = jwt.sign({ userId, jti }, secret, { expiresIn: "7d" });

  await redis.setex(`refresh:${jti}`, REFRESH_TOKEN_TTL_SECONDS, userId);
  await redis.sadd(`user_sessions:${userId}`, jti);
  await redis.expire(`user_sessions:${userId}`, REFRESH_TOKEN_TTL_SECONDS);

  return refreshToken;
}

async function revokeAllSessions(userId: string) {
  const jtis = await redis.smembers(`user_sessions:${userId}`);
  if (jtis.length > 0) {
    const keys = jtis.map((jti) => `refresh:${jti}`);
    await redis.del(...keys);
  }
  await redis.del(`user_sessions:${userId}`);
}

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true in production (requires HTTPS)
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
  });
}

/**
 * POST /auth/register
 * Creates the user, then a default personal workspace for them,
 */
export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password, fullName, otp } = parsed.data;

  const attempts = await redis.get(`otp_attempts:${email}`);
  if (attempts && parseInt(attempts) >= 5) {
    await redis.del(`otp:${email}`);
    await redis.del(`otp_attempts:${email}`);
    return res.status(429).json({ error: "Too many attempts. Please request a new OTP." });
  }

  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp || storedOtp !== otp) {
    await redis.incr(`otp_attempts:${email}`);
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }
  await redis.del(`otp:${email}`);
  await redis.del(`otp_attempts:${email}`);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [email, passwordHash, fullName]
    );
    const userId = userResult.rows[0].id;

    const workspaceResult = await client.query(
      `INSERT INTO workspaces (user_id, name, type, is_default)
       VALUES ($1, $2, 'personal', true)
       RETURNING id`,
      [userId, `${fullName}'s Workspace`]
    );
    const workspaceId = workspaceResult.rows[0].id;

    await client.query("COMMIT");

    const accessToken = signAccessToken(userId, workspaceId);
    const refreshToken = await signRefreshToken(userId);
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      accessToken,
      user: {
        id: userId,
        email,
        fullName,
      },
      workspaceId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Register error:", err);
    return res.status(500).json({ error: "Something went wrong during registration" });
  } finally {
    client.release();
  }
}

/**
 * POST auth/login
 * Verifies credentials and issues a token scoped to the user's default workspace.
 */
export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  try {
    const userResult = await pool.query(
      "SELECT id, password_hash, full_name FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = userResult.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const workspaceResult = await pool.query(
      "SELECT id FROM workspaces WHERE user_id = $1 AND is_default = true",
      [user.id]
    );
    if (workspaceResult.rows.length === 0) {
      return res.status(500).json({ error: "No default workspace found for this user" });
    }
    const workspaceId = workspaceResult.rows[0].id;

    const accessToken = signAccessToken(user.id, workspaceId);
    const refreshToken = await signRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    return res.json({
      accessToken,
      user: {
        id: user.id,
        email,
        fullName: user.full_name,
      },
      workspaceId,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Something went wrong during login" });
  }
}


/**
 * POST /auth/refresh
 * Validates the refresh token cookie, rotates it, and issues a new access token.
 * Detects token reuse (a sign of theft) and revokes all sessions if found.
 */
export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  const secret = process.env.JWT_REFRESH_TOKEN;
  if (!secret) {
    throw new Error("JWT_REFRESH_TOKEN not set");
  }

  try {
    const payload = jwt.verify(token, secret) as { userId: string; jti: string };

    const stored = await redis.get(`refresh:${payload.jti}`);

    if (!stored) {
      // Not an active session — check if this JTI was already used before (reuse = theft signal)
      const wasUsed = await redis.get(`used_refresh:${payload.jti}`);
      if (wasUsed) {
        console.warn(`Refresh token reuse detected for user ${payload.userId} — revoking all sessions`);
        await revokeAllSessions(payload.userId);
      }
      res.clearCookie("refreshToken");
      return res.status(401).json({ error: "Refresh token is invalid or has been revoked" });
    }

    // Rotation: retire the old JTI (mark as used, not just deleted) and remove from active set
    await redis.del(`refresh:${payload.jti}`);
    await redis.setex(`used_refresh:${payload.jti}`, USED_TOKEN_GRACE_SECONDS, payload.userId);
    await redis.srem(`user_sessions:${payload.userId}`, payload.jti);

    const workspaceResult = await pool.query(
      "SELECT id FROM workspaces WHERE user_id = $1 AND is_default = true",
      [payload.userId]
    );
    if (workspaceResult.rows.length === 0) {
      return res.status(500).json({ error: "No default workspace found for this user" });
    }
    const workspaceId = workspaceResult.rows[0].id;

    const newAccessToken = signAccessToken(payload.userId, workspaceId);
    const newRefreshToken = await signRefreshToken(payload.userId);
    setRefreshCookie(res, newRefreshToken);

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.clearCookie("refreshToken");
    return res.status(401).json({ error: "Refresh token is invalid or expired" });
  }
}

/**
 * POST /auth/logout
 * Revokes the current refresh token so it can no longer be used.
 */
export async function logout(req: Request, res: Response) {
  const { userId, jti } = req.refreshAuth!;
  await redis.del(`refresh:${jti}`);
  await redis.srem(`user_sessions:${userId}`, jti);

  res.clearCookie("refreshToken");
  return res.status(200).json({ message: "Logged out successfully" });
}


/**
 * POST /auth/logout-all
 * Revokes every active refresh token for the current user across all devices.
 * Requires a valid refresh token to identify the user.
 */
export async function logoutAll(req: Request, res: Response) {
  await revokeAllSessions(req.refreshAuth!.userId);
  res.clearCookie("refreshToken");
  return res.status(200).json({ message: "Logged out of all devices" });
}