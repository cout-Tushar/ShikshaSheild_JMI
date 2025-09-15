const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, text, html) {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject,
      text,
      html,
    };

    await sgMail.send(msg);
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error('❌ Email error:', error.response ? error.response.body : error.message);
  }
}

module.exports = sendEmail;
