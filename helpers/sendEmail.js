/* Send email using Gmail credentials */
import nodemailer from "nodemailer";

export async function sendEmail({ action, to, text }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error("Missing Gmail credentials");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: action || "Notification",
    text
  });
}
