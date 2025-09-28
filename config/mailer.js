const nodemailer = require('nodemailer');
const dotenv =require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function sendMail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM || process.env.MAIL_USER;

  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    console.log('Email sent:', info);
    return info;
  } catch (error) {
    console.error('SMTP sendMail failed:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error; // so the calling function still knows it failed
  }
}

module.exports = { sendMail };
