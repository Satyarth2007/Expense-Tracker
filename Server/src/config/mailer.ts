import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error("Missing RESEND_API_KEY in environment variables");
}

const resend = new Resend(apiKey);

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html: string;
}) {
  const { data, error } = await resend.emails.send({
    from: "ExpenseDekho <onboarding@resend.dev>",
    to: [to],
    subject,
    text,
    html,
  });

  if (error) {
    console.error("Email sending failed:", error);
    throw new Error(error.message);
  }

  console.log("Email sent successfully:", data?.id);

  return data;
}