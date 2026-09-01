import { sendEmail } from "../config/mailer.js";

export async function sendOtpEmail(
  email: string,
  otp: string
): Promise<void> {
  await sendEmail({
    to: email,

    subject: "Your ExpenseDekho verification code",

    text: `Your OTP is ${otp}. It expires in 5 minutes. If you didn't request this, you can ignore this email.`,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 420px;
        margin: 40px auto;
        padding: 24px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
      ">

        <h2 style="color: #1F4D3A;">
          ExpenseDekho
        </h2>

        <p>
          Your verification code is:
        </p>

        <p style="
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 4px;
          color: #1F4D3A;
        ">
          ${otp}
        </p>

        <p style="
          color: #6B5F4C;
          font-size: 13px;
        ">
          This code expires in 5 minutes.
          If you didn't request this, you can safely ignore this email.
        </p>

      </div>
    `,
  });
}