import crypto from "crypto";
import { pool } from "../config/db.js";
import { redis } from "../config/redis.js";
import { sendOtpSchema } from "../validators/authValidators.js";
import { sendOtpEmail } from "../utils/sendOtpEmail.js";
export async function sendOtp(req, res) {
    const parsed = sendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { email } = parsed.data;
    try {
        const existing = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "An account with this email already exists" });
        }
        const otp = crypto.randomInt(100000, 999999).toString();
        await redis.setex(`otp:${email}`, 300, otp);
        await redis.setex(`otp_attempts:${email}`, 300, "0");
        await sendOtpEmail(email, otp);
        return res.status(200).json({ message: "OTP sent successfully" });
    }
    catch (err) {
        console.error("Send OTP error:", err);
        return res.status(500).json({ error: "Failed to send OTP" });
    }
}
//# sourceMappingURL=otpController.js.map