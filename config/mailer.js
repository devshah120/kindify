// config/mailer.js
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendMail({ to, subject, html, text, bcc }) {
  const msg = {
    to,
    from: process.env.SENDER_EMAIL, // must be a verified sender
    subject,
    text: text || 'hello from kindify', // optional plain text
    html,
  };

  // Add BCC if provided
  if (bcc) {
    msg.bcc = bcc;
  }

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}${bcc ? ` (BCC: ${bcc})` : ''}`);
    return { success: true };
  } catch (error) {
    console.error('❌ SendGrid error:', error.response?.body || error.message);
    throw new Error('Email sending failed');
  }
}

module.exports = { sendMail };
