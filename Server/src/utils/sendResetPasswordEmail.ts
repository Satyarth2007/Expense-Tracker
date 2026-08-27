import { transporter } from "../config/mailer.js";

export async function sendResetPasswordEmail(email: string, resetLink: string): Promise<void> {
  await transporter.sendMail({
    from: `"ExpenseDekho" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your ExpenseDekho password",
    text: `We received a request to reset your password. Click the link below to choose a new one:\n\n${resetLink}\n\nThis link expires in 30 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: auto;">
        <h2 style="color: #1F4D3A;">ExpenseDekho</h2>
        <p>We received a request to reset your password. Click below to choose a new one:</p>
        <p>
          <a href="${resetLink}" style="display:inline-block; background:#1F4D3A; color:#fff; padding:12px 20px; border-radius:4px; text-decoration:none;">
            Reset Password
          </a>
        </p>
        <p style="color: #6B5F4C; font-size: 13px;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}