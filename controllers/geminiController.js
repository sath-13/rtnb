import axios from 'axios';

// ⚙️ Gemini API Setup
const GEMINI_API_KEY = "AIzaSyDHjrtT_1te5kCjmUTC0YVo1b1zcZrqnY0"; // Note: It's best practice to store API keys in .env files
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ✳️ Generate Questions via Gemini
export const generateQuestions = async (req, res) => {
  try {
    const userMessage = req.body.message;
    
    const response = await axios.post(
      GEMINI_URL, 
      {
        contents: [{
          role: "user",
          parts: [{ text: userMessage }],
        }],
      }, 
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    
    const output = response.data.candidates[0].content.parts[0].text;
    res.json({ reply: output });
  } catch (err) {
    console.error("❌ Error in /api/ask:", err.response?.data || err.message || err);
    res.status(500).json({ 
      error: "Something went wrong", 
      detail: err.message 
    });
  }
};
