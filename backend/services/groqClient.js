import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Initialize GROQ Client
console.log('GROQ API Key loaded:', process.env.GROQ_API_KEY ? 'Yes (length: ' + process.env.GROQ_API_KEY.length + ')' : 'No');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Standard AI response format
const RESPONSE_FORMAT = `
You MUST respond ONLY with valid JSON in this exact format:
{
  "rating": "number from 0-10",
  "feedback": "detailed overall feedback",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "improved_version": "improved/corrected version of the content"
}
Do not include any text outside the JSON object.
`;

// Evaluate Assignment
export const evaluateAssignment = async (content, criteria = {}) => {
  // Truncate content to avoid token limits (roughly 4 chars per token, max ~6000 tokens for input)
  const maxChars = 20000;
  const truncatedContent = content.length > maxChars 
    ? content.substring(0, maxChars) + '\n\n[Content truncated for evaluation...]' 
    : content;

  const prompt = `
You are an expert academic evaluator. Analyze the following assignment/document and provide a comprehensive evaluation.

CONTENT TO EVALUATE:
"""
${truncatedContent}
"""

EVALUATION CRITERIA:
- Grammar and Language Quality (spelling, punctuation, sentence structure)
- Structure and Organization (logical flow, headings, paragraphs)
- Content Strength (depth of analysis, evidence, arguments)
- Tone and Style (appropriate academic tone, consistency)
- Plagiarism Likelihood (originality indicators, generic phrases)
- Completeness (coverage of topic, conclusion presence)

${RESPONSE_FORMAT}

Be specific, accurate, and constructive. Do not hallucinate facts. Base your evaluation only on what is present in the content.
`;

  try {
    console.log('Evaluating content, length:', truncatedContent.length, 'chars');
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    console.log('GROQ response received, length:', responseText.length);
    
    // Try to extract JSON from response
    let response;
    try {
      response = JSON.parse(responseText);
    } catch (parseError) {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        response = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Failed to parse GROQ response:', responseText);
        throw new Error('Invalid response format from AI');
      }
    }
    
    return response;
  } catch (error) {
    console.error('GROQ API Error (evaluateAssignment):', error.message || error);
    throw new Error('Failed to evaluate assignment: ' + (error.message || 'Unknown error'));
  }
};

// Quick Feedback for Notes
export const quickFeedback = async (text) => {
  const prompt = `
You are a helpful writing assistant. Analyze the following text and provide immediate, constructive feedback.

TEXT TO ANALYZE:
"""
${text}
"""

Evaluate for:
- Grammar and spelling errors
- Clarity and readability
- Tone appropriateness
- Suggested improvements

${RESPONSE_FORMAT}

Provide a corrected/improved version in the "improved_version" field.
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 3000,
          });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return response;
  } catch (error) {
    console.error('GROQ API Error (quickFeedback):', error);
    throw new Error('Failed to generate feedback');
  }
};

// Generate Blog/Essay
export const generateBlog = async ({ topic, keywords, audience, length, tone }) => {
  const prompt = `
You are an expert content writer and SEO specialist. Generate a high-quality blog post/essay based on the following specifications:

TOPIC: ${topic}
KEYWORDS: ${keywords?.join(', ') || 'general'}
TARGET AUDIENCE: ${audience || 'general readers'}
REQUIRED LENGTH: approximately ${length || 500} words
TONE: ${tone || 'informational'}

Generate a complete blog post with:
1. An engaging title
2. Proper headings and subheadings (use markdown format)
3. Well-structured paragraphs
4. SEO-friendly meta title and description
5. Suggested tags
6. Readability grade (Flesch-Kincaid)
7. Citation recommendations if applicable

Respond in this JSON format:
{
  "title": "SEO-friendly blog title",
  "content": "Full blog content with markdown formatting",
  "metaTitle": "SEO meta title (max 60 chars)",
  "metaDescription": "SEO meta description (max 160 chars)",
  "tags": ["tag1", "tag2", ...],
  "readabilityGrade": "grade level",
  "citations": ["citation1", "citation2", ...] or [],
  "wordCount": number
}

Ensure the content is original, engaging, and valuable to the reader.
`;

  try {
    console.log('Generating blog for topic:', topic);
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    console.log('Blog generation response received, length:', responseText.length);
    
    // Try to extract JSON from response
    let response;
    try {
      response = JSON.parse(responseText);
    } catch (parseError) {
      console.log('Direct JSON parse failed, trying to extract...');
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          // Clean up common JSON issues
          let cleanJson = jsonMatch[0]
            .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
            .replace(/\n/g, '\\n') // Escape newlines in strings
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          response = JSON.parse(cleanJson);
        } catch (e) {
          // Last resort: create a basic response
          console.error('JSON extraction failed, creating fallback response');
          response = {
            title: 'Generated Blog',
            content: responseText,
            metaTitle: 'Blog Post',
            metaDescription: 'AI generated content',
            tags: [],
            readabilityGrade: 'N/A',
            citations: [],
            wordCount: responseText.split(/\s+/).length
          };
        }
      } else {
        // No JSON found, use raw text as content
        console.error('No JSON found in response, using raw text');
        response = {
          title: 'Generated Blog',
          content: responseText,
          metaTitle: 'Blog Post',
          metaDescription: 'AI generated content',
          tags: [],
          readabilityGrade: 'N/A',
          citations: [],
          wordCount: responseText.split(/\s+/).length
        };
      }
    }
    
    return response;
  } catch (error) {
    console.error('GROQ API Error (generateBlog):', error.message || error);
    throw new Error('Failed to generate blog: ' + (error.message || 'Unknown error'));
  }
};

// Review Blog before posting
export const reviewBlog = async (content) => {
  const prompt = `
You are a professional editor and content reviewer. Review the following blog/essay for quality and provide detailed feedback.

CONTENT TO REVIEW:
"""
${content}
"""

Analyze for:
- Writing quality and grammar
- SEO optimization potential
- Engagement and readability
- Plagiarism indicators (generic AI-generated patterns)
- Content originality
- Suggested enhancements

${RESPONSE_FORMAT}

In "improved_version", provide the enhanced version of the content.
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 4000,
          });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return response;
  } catch (error) {
    console.error('GROQ API Error (reviewBlog):', error);
    throw new Error('Failed to review blog');
  }
};

// Check for toxicity in comments
export const checkToxicity = async (text) => {
  const prompt = `
Analyze the following comment for toxicity, hate speech, spam, or inappropriate content.

COMMENT:
"""
${text}
"""

Respond in this JSON format:
{
  "isToxic": boolean,
  "isSpam": boolean,
  "isHateSpeech": boolean,
  "toxicityScore": number from 0-1,
  "categories": ["category1", ...] or [],
  "reason": "explanation if flagged",
  "sanitizedVersion": "cleaned version if possible, or null"
}
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 500,
          });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return response;
  } catch (error) {
    console.error('GROQ API Error (checkToxicity):', error);
    return { isToxic: false, isSpam: false, isHateSpeech: false, toxicityScore: 0 };
  }
};

// Get learning recommendations based on history
export const getLearningRecommendations = async (evaluationHistory) => {
  const prompt = `
Based on the following evaluation history of a student's writing, provide personalized learning recommendations.

EVALUATION HISTORY:
${JSON.stringify(evaluationHistory, null, 2)}

Provide recommendations in this JSON format:
{
  "weakAreas": ["area1", "area2", ...],
  "strongAreas": ["area1", "area2", ...],
  "recommendedBooks": [{"title": "", "author": "", "reason": ""}],
  "recommendedChannels": [{"name": "", "platform": "", "link": "", "reason": ""}],
  "writingCourses": [{"name": "", "platform": "", "reason": ""}],
  "toneAdaptationTips": ["tip1", "tip2", ...],
  "practiceExercises": ["exercise1", "exercise2", ...],
  "overallAdvice": "personalized advice string"
}
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 2000,
          });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return response;
  } catch (error) {
    console.error('GROQ API Error (getLearningRecommendations):', error);
    throw new Error('Failed to get recommendations');
  }
};

// Chat completion for interactive feedback
export const chatCompletion = async (messages) => {
  try {
    const systemMessage = {
      role: 'system',
      content: `You are an expert writing assistant for the AI Assignment Evaluator platform. 
Help users improve their writing, answer questions about grammar, structure, and academic writing.
Always be constructive and educational. When providing feedback, use the standard JSON format when appropriate.
${RESPONSE_FORMAT}`
    };

    const completion = await groq.chat.completions.create({
      messages: [systemMessage, ...messages],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 2000
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('GROQ API Error (chatCompletion):', error);
    throw new Error('Failed to get response');
  }
};

export default {
  evaluateAssignment,
  quickFeedback,
  generateBlog,
  reviewBlog,
  checkToxicity,
  getLearningRecommendations,
  chatCompletion
};
