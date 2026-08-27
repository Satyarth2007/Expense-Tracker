import { Request, Response } from "express";
import crypto from "crypto";
import { pool } from "../config/db.js";
import { redis } from "../config/redis.js";
import { forgotPasswordSchema } from "../validators/authValidators.js";
import { sendResetPasswordEmail } from "../utils/sendResetPasswordEmail.js";
import bcrypt from "bcrypt";
import { resetPasswordSchema } from "../validators/authValidators.js";
import { revokeAllSessions } from "../utils/sessionUtils.js";

const RESET_TOKEN_TTL_SECONDS = 30 * 60; // 30 minutes
const SALT_ROUNDS = 12;

/**
 * POST /auth/forgot-password
 * If the email belongs to a registered account, generates a one-time
 * reset link and emails it. Always returns a generic response so the
 * caller can't tell whether the email exists (prevents enumeration).
 */
export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email } = parsed.data;

  try {
    const userResult = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      const token = crypto.randomBytes(32).toString("hex");

      await redis.setex(`reset_token:${token}`, RESET_TOKEN_TTL_SECONDS, userId);

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      await sendResetPasswordEmail(email, resetLink);
    }

    return res.status(200).json({
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}



/**
 * POST /auth/reset-password
 * Validates the reset token, updates the user's password, and revokes
 * all active sessions so every device is forced to log in again.
 */
export async function resetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { token, newPassword } = parsed.data;

  try {
    const userId = await redis.get(`reset_token:${token}`);
    if (!userId) {
      return res.status(400).json({ error: "This reset link is invalid or has expired" });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [passwordHash, userId]
    );

    await redis.del(`reset_token:${token}`);
    await revokeAllSessions(userId);

    return res.status(200).json({ message: "Password reset successfully. Please log in again." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}