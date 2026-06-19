const nodemailer = require('nodemailer');
// require('dotenv').config();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"My App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
}

async function sendRegistrationEmail(userEmail, name) {
    const subject ='Welcome to Backend Ledger!!';
    const text = `Hello ${name},\n\nThank you for registering with Backend Ledger! We're excited to have you on board.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>Thank you for registering with Backend Ledger! We're excited to have you on board.</p><p>Best regards,<br>The Backend Ledger Team</p>`;
    await sendEmail({ to: userEmail, subject, text, html });
}

async function sendTransactionEmail(userEmail, name, amount,toAccount){
    const subject ='Transaction Alert from Backend Ledger!!';
    const text = `Hello ${name},\n\nA transaction of amount ${amount} has been made to account ${toAccount}.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>A transaction of amount <strong>${amount}</strong> has been made to account <strong>${toAccount}</strong>.</p><p>Best regards,<br>The Backend Ledger Team</p>`;
    await sendEmail({ to: userEmail, subject, text, html });
}

async function sendTransactionFailureEmail(userEmail, name, amount,toAccount){
    const subject ='Transaction Failure Alert from Backend Ledger!!';
    const text = `Hello ${name},\n\nA transaction of amount ${amount} to account ${toAccount} has failed.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>A transaction of amount <strong>${amount}</strong> to account <strong>${toAccount}</strong> has failed.</p><p>Best regards,<br>The Backend Ledger Team</p>`;
    await sendEmail({ to: userEmail, subject, text, html });
}


module.exports = { sendRegistrationEmail, sendTransactionEmail,sendTransactionFailureEmail  };