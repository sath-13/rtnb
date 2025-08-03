import mammoth from 'mammoth';

/**
 * Parses a DOCX buffer and extracts its text content.
 * @param {Buffer} buffer The DOCX file content as a buffer.
 * @returns {Promise<{text: string}>} An object containing the extracted text.
 */
export async function parseDocxBuffer(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value };
}