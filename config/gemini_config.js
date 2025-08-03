import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') }); 

const config = {
  port: process.env.PORT,
  mongoUri: process.env.MONGO_URI,
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
  },
  google: {
    keyFilePath: path.join(__dirname, '..', 'utils', 'service-account.json')
  }
};

export default config;