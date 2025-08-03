import express from 'express';
import nodemailer from 'nodemailer';
import { AuthMessages } from '../constants/enums.js';
const router = express.Router();

router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  const resetToken = 'unique-reset-token'; // You should generate this dynamically
  const resetUrl = `http://your-frontend-url.com/reset-password?token=${resetToken}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: AuthMessages.PASSWORD_RESET_EMAIL_SENT });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: AuthMessages.FAILED_TO_SEND_EMAIL });
  }
});

export default router;
