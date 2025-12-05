import pdf from 'pdf-parse';
import fetch from 'node-fetch';
import fs from 'fs';

// Extract text from PDF buffer
export const extractTextFromPDF = async (pdfBuffer) => {
  try {
    const data = await pdf(pdfBuffer);
    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
      metadata: data.metadata
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

// Extract text from local PDF file path
export const extractTextFromPDFPath = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return await extractTextFromPDF(buffer);
  } catch (error) {
    console.error('PDF file extraction error:', error);
    throw new Error('Failed to extract text from PDF file');
  }
};

// Extract text from PDF URL (Cloudinary)
export const extractTextFromPDFUrl = async (pdfUrl) => {
  try {
    // If it's a local file path, use file system
    if (pdfUrl.includes('uploads') || !pdfUrl.startsWith('http')) {
      return await extractTextFromPDFPath(pdfUrl);
    }
    
    const response = await fetch(pdfUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch PDF');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return await extractTextFromPDF(buffer);
  } catch (error) {
    console.error('PDF URL extraction error:', error);
    throw new Error('Failed to extract text from PDF URL');
  }
};

// Clean and normalize extracted text
export const cleanText = (text) => {
  if (!text) return '';
  
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove special characters that might cause issues
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Get word count
export const getWordCount = (text) => {
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
};

// Get character count
export const getCharacterCount = (text) => {
  if (!text) return 0;
  return text.length;
};

// Get sentence count
export const getSentenceCount = (text) => {
  if (!text) return 0;
  return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
};

// Get paragraph count
export const getParagraphCount = (text) => {
  if (!text) return 0;
  return text.split(/\n\n+/).filter(para => para.trim().length > 0).length;
};

// Basic text statistics
export const getTextStats = (text) => {
  const cleanedText = cleanText(text);
  
  return {
    wordCount: getWordCount(cleanedText),
    characterCount: getCharacterCount(cleanedText),
    sentenceCount: getSentenceCount(cleanedText),
    paragraphCount: getParagraphCount(cleanedText),
    averageWordLength: cleanedText.length > 0 
      ? (cleanedText.replace(/\s/g, '').length / getWordCount(cleanedText)).toFixed(2) 
      : 0
  };
};

export default {
  extractTextFromPDF,
  extractTextFromPDFUrl,
  cleanText,
  getWordCount,
  getCharacterCount,
  getSentenceCount,
  getParagraphCount,
  getTextStats
};
