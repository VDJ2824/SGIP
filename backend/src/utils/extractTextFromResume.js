import mammoth from 'mammoth';
import { createRequire } from 'module';
import { AppError, errorCodes } from '../errors/index.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

function sanitizeResumeText(value = '') {
  return String(value)
    .replace(/\0/g, '')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 50000);
}

function scoreExtractedText(value = '') {
  const text = String(value || '').trim();
  if (!text) return 0;

  const nonWhitespace = text.replace(/\s/g, '').length;
  const lineCount = text.split(/\r?\n/).filter(Boolean).length;
  const punctuationDensity = (text.match(/[.:,;()[\]{}\-]/g) || []).length;

  return nonWhitespace + lineCount * 40 + punctuationDensity * 5;
}

function pickBestText(candidates = []) {
  return candidates
    .map((candidate) => sanitizeResumeText(candidate))
    .filter(Boolean)
    .sort((left, right) => scoreExtractedText(right) - scoreExtractedText(left))[0] || '';
}

async function parsePdfWithLegacyFunction(buffer) {
  if (typeof pdfParse !== 'function') return '';
  const parsed = await pdfParse(buffer);
  return parsed.text || '';
}

async function parsePdfWithModernParser(buffer, parseOptions) {
  if (!pdfParse?.PDFParse) return '';

  const parser = new pdfParse.PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText(parseOptions);
    return parsed.text || '';
  } finally {
    await parser.destroy?.();
  }
}

async function parsePdf(buffer) {
  const candidates = await Promise.allSettled([
    parsePdfWithLegacyFunction(buffer),
    parsePdfWithModernParser(buffer, {
      disableNormalization: true,
      lineEnforce: true,
      cellSeparator: ' ',
      pageJoiner: '\n',
    }),
    parsePdfWithModernParser(buffer, {
      disableNormalization: true,
      lineEnforce: false,
      itemJoiner: '',
      pageJoiner: '\n',
    }),
  ]);

  const successfulText = candidates
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  const bestText = pickBestText(successfulText);
  if (bestText) return bestText;

  throw new Error('Unsupported pdf-parse API');
}

export async function extractTextFromResume(file) {
  if (file.mimetype === 'application/pdf') {
    return await parsePdf(file.buffer);
  }

  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return sanitizeResumeText(parsed.value || '');
  }

  throw new AppError('Unsupported resume file type', 400, errorCodes.VALIDATION_ERROR);
}
