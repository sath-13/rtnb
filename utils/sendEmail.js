import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (options) => {
  try {
    // Ensure recipients are valid
    if (!options.email || (Array.isArray(options.email) && options.email.length === 0)) {
      console.error("❌ Error: No recipient email provided.");
      return;
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Error: Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.");
      return;
    }

    // Convert single email to array if needed
    const recipientEmails = Array.isArray(options.email) ? options.email : [options.email];

    // Use Gmail service with only user and pass
    const transporterConfig = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };


    const transporter = nodemailer.createTransport(transporterConfig);

    // Send emails one by one
    for (const email of recipientEmails) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments, // Include attachments here
      };

      try {
        const result = await transporter.sendMail(mailOptions);

      } catch (err) {
        console.error(`[sendEmail] Failed to send email to ${email}:`, err);
      }
    }

  } catch (error) {
    console.error("[sendEmail] General failure:", error);
  }
};

export default sendEmail;
