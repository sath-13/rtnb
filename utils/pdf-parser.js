// backend/utils/pdf-parser.js

import { createRequire } from 'module';

// This creates a 'require' function that we can use inside our ES module,
// which is the most reliable way to load older CommonJS packages.
const require = createRequire(import.meta.url);

// Now, load pdf-parse using the new require function.
const pdf = require('pdf-parse');

/**
 * Parses a PDF buffer and extracts its text content.
 * @param {Buffer} buffer The PDF file content as a buffer.
 * @returns {Promise<{text: string}>} An object containing the extracted text.
 */
export async function parsePdfBuffer(buffer) {
  const data = await pdf(buffer);
  return { text: data.text };
}