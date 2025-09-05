import nodemailer from "nodemailer";

type EmailContent = {
  email: string;
  subject: string;
  message: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
};

const sendEmail = async ({ email, subject, message, attachments = [] }: EmailContent) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.EMAIL_SECURE === "true", // false for port 587, true for port 465
    auth: {
      user: process.env.SMTP_USER, // Your email
      pass: process.env.SMTP_PASS, // Your password
    },
    tls: {
      rejectUnauthorized: false, // Fixes potential SSL issues
    },
  });

  await transporter.sendMail({
    from: `"Evently Managment" <${process.env.SMTP_USER}>`,
    to: email,
    subject: subject,
    html: message,
    attachments,
  });

  console.log("Email sent successfully!");
};

export default sendEmail;