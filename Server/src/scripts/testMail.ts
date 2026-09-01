import "dotenv/config";

import { sendEmail } from "../config/mailer.js";

async function main() {
  const info = await sendEmail({
    to: "YOUR_EMAIL@gmail.com",
    subject: "ExpenseDekho — test email",
    text: "If you're reading this, Resend is wired up correctly.",
    html: `
      <h2>ExpenseDekho</h2>
      <p>
        If you're reading this, Resend is wired up correctly.
      </p>
      <p>
        This is a test email from your ExpenseDekho backend.
      </p>
    `,
  });

  console.log("Message sent:", info?.id);
}

main().catch((err) => {
  console.error("Test email failed:", err);
  process.exit(1);
});