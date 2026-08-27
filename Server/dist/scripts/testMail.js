import "dotenv/config";
import { transporter } from "../config/mailer.js";
async function main() {
    const info = await transporter.sendMail({
        from: `"ExpenseDekho" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: "ExpenseDekho — test email",
        text: "If you're reading this, Nodemailer + Gmail is wired up correctly.",
    });
    console.log("Message sent:", info.messageId);
}
main().catch((err) => {
    console.error("Test email failed:", err);
    process.exit(1);
});
//# sourceMappingURL=testMail.js.map