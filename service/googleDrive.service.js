import { google } from 'googleapis';
import config from '../config/gemini_config.js';
import { parsePdfBuffer } from '../utils/pdf-parser.js';
import { parseDocxBuffer } from '../utils/docx-parser.js';

const auth = new google.auth.GoogleAuth({
  keyFile: config.google.keyFilePath,
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/documents.readonly',
  ],
});
const drive = google.drive({ version: 'v3', auth });
const docs = google.docs({ version: 'v1', auth });

const extractTextFromGoogleDoc = (doc) => {
  let text = '';
  doc.body.content.forEach(element => {
    if (element.paragraph) {
      element.paragraph.elements.forEach(elem => {
        if (elem.textRun) text += elem.textRun.content;
      });
    }
  });
  return text;
};

export const extractTextFromFiles = async (fileNames) => {
  let fileContent = '';
  for (const fileName of fileNames) {
    const driveRes = await drive.files.list({
      q: `name='${fileName.trim()}' and (mimeType='application/vnd.google-apps.document' or mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document') and trashed=false`,
      fields: 'files(id, name, mimeType)',
      pageSize: 1
    });

    const file = driveRes.data.files[0];
    if (!file) {
      console.log(` File not found: ${fileName}`);
      continue;
    }

    console.log(` Found file: ${file.name} (MIME Type: ${file.mimeType})`);
    let extractedText = '';

    if (file.mimeType === 'application/vnd.google-apps.document') {
      const docRes = await docs.documents.get({ documentId: file.id });
      extractedText = extractTextFromGoogleDoc(docRes.data);
    } else if (file.mimeType === 'application/pdf') {
      const pdfRes = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
      extractedText = (await parsePdfBuffer(Buffer.from(pdfRes.data))).text;
    } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const docxRes = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
      extractedText = (await parseDocxBuffer(Buffer.from(docxRes.data))).text;
    }
    fileContent += `\n\n--- Content from ${file.name} ---\n` + extractedText;
  }
  return fileContent;
};