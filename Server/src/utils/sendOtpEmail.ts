import { transporter } from "../config/mailer.js";

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: `"ExpenseDekho" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your ExpenseDekho verification code",
    text: `Your OTP is ${otp}. It expires in 5 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: auto;">
        <h2 style="color: #1F4D3A;">ExpenseDekho</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
        <p style="color: #6B5F4C; font-size: 13px;">This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}