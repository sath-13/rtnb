import multer from 'multer';
import fs from 'fs';
import path from 'path';
import sendEmail  from '../utils/sendEmail.js'; // Import the sendEmail utility

// Define file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage }).single('file');

export const sendEmailWithAttachment = async (req, res) => {
  const { recipients, subject, body, csvData } = req.body;

  try {
    // Ensure csvData is a valid string
    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).send('Invalid CSV data');
    }

    // Create a buffer from the CSV data
    const buffer = Buffer.from(csvData, 'utf-8');

    // Prepare the email options
    const emailOptions = {
      email: recipients, 
      subject: subject,
      html: body,
      attachments: [
        {
          filename: 'user-data.csv',
          content: buffer, 
        },
      ],
    };

    // Send email with attachment using the utility
    await sendEmail(emailOptions);

    res.status(200).send('Email sent successfully');
  } catch (error) {
    res.status(500).send('Error sending email');
  }
};

