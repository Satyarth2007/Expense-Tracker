import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
  throw new Error("Missing EMAIL_USER or EMAIL_APP_PASSWORD in environment variables");
}

// Explicitly typed as SMTPTransport.Options so TypeScript resolves the
// correct createTransport() overload — a plain object literal here makes
// TS pick a generic Transport overload that doesn't recognize `host`.
//
// `family` is intersected in separately: nodemailer accepts and forwards it
// to the underlying socket connection at runtime, but it isn't declared on
// SMTPTransport.Options itself, so TS rejects it without this widening.
const transportOptions: SMTPTransport.Options & { family?: number } = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_APP_PASSWORD,
  },
  // Render's outbound network doesn't support IPv6, and Node sometimes
  // resolves smtp.gmail.com to an IPv6 address, causing ENETUNREACH.
  // Forcing IPv4 here sidesteps that at the socket level, rather than
  // relying on the NODE_OPTIONS dns-result-order flag alone.
  family: 4,
};

export const transporter = nodemailer.createTransport(transportOptions);

transporter.verify((error) => {
  if (error) {
    console.error("Mailer configuration error:", error);
  } else {
    console.log("Mailer is ready to send emails");
  }
});