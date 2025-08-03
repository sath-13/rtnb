import axios from 'axios';
import config from '../config/gemini_config.js';

/**
 * A robust function to find and parse JSON from a string.
 * It handles cases where the AI adds extra text before or after the JSON block.
 * @param {string} text - The raw text response from the AI.
 * @returns {object} - The parsed JSON object.
 */
const sanitizeAndParseJson = (text) => {
  const startIndex = text.indexOf('[');
  const endIndex = text.lastIndexOf(']');

  if (startIndex === -1 || endIndex === -1) {
    throw new Error("No valid JSON array found in the AI's response.");
  }

  const jsonString = text.substring(startIndex, endIndex + 1);
  return JSON.parse(jsonString);
};

/**
 * Generates compliance questions by building a prompt and calling the Gemini API.
 * @param {object} details - The details for building the prompt.
 * @param {number} details.numQuestions - The number of questions to generate.
 * @param {string} details.topic - The topic of the test.
 * @param {string} details.fileContent - The extracted text from documents.
 * @returns {Promise<object>} - The generated questions as a JSON object.
 */
export const generateComplianceQuestions = async ({ numQuestions, topic, fileContent }) => {
  let finalContent;
  
  // The prompt-building logic now lives here, in the service.
  if (fileContent && fileContent.trim().length > 0) {
    console.log("Service: Generating questions based on file content.");
    finalContent = fileContent;
  } else {
    console.log("Service: No file content found. Falling back to topic-based generation.");
    finalContent = `This is a simulated policy document about ${topic}. The main rule is to always secure your workstation before leaving your desk. The penalty for non-compliance is a formal warning. Data should never be shared with unauthorized third parties.`;
  }

  const prompt = `Based on the following document content, generate exactly ${numQuestions} multiple-choice questions with 4 options each and the correct answer. The topic is "${topic}". Respond ONLY with a valid JSON array of objects. Do not include any introductory text, closing remarks, or markdown formatting like \`\`\`json. The output must be a raw, valid JSON array string. Example format: [{ "question": "...", "options": ["A", "B", "C", "D"], "answer": "Correct Option Text" }]. Document Content: ${finalContent}`;

  const response = await axios.post(config.gemini.url, {
    contents: [{ parts: [{ text: prompt }] }],
  }, { headers: { "Content-Type": "application/json" } });

  const output = response.data.candidates[0].content.parts[0].text;
  
  // Use the sanitizing function to safely parse the response.
  return sanitizeAndParseJson(output);
};