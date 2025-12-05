// Simple plagiarism and AI detection indicators
// Note: This is a basic implementation. For production, consider using dedicated APIs.

// Common AI-generated patterns
const AI_PATTERNS = [
  /in conclusion,?\s/gi,
  /it is important to note that/gi,
  /it's worth noting that/gi,
  /in today's (world|society|age)/gi,
  /at the end of the day/gi,
  /when it comes to/gi,
  /in this (article|essay|blog)/gi,
  /first and foremost/gi,
  /last but not least/gi,
  /plays a (crucial|vital|important|key) role/gi,
  /in order to/gi,
  /due to the fact that/gi,
  /it goes without saying/gi,
  /needless to say/gi,
  /as we all know/gi,
  /in the (modern|digital) (era|age)/gi,
  /has become increasingly/gi,
  /it is (widely|generally) (known|accepted)/gi,
  /one of the most (important|significant)/gi,
  /there are (many|several|numerous) (ways|reasons|factors)/gi
];

// Common filler phrases that indicate low-quality writing
const FILLER_PATTERNS = [
  /very\s+\w+/gi,
  /really\s+\w+/gi,
  /basically/gi,
  /actually/gi,
  /literally/gi,
  /obviously/gi,
  /clearly/gi,
  /simply put/gi,
  /to be honest/gi,
  /in my opinion/gi
];

// Check for AI-generated patterns
export const detectAIPatterns = (text) => {
  const matches = [];
  let totalMatches = 0;
  
  AI_PATTERNS.forEach(pattern => {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found);
      totalMatches += found.length;
    }
  });
  
  const wordCount = text.split(/\s+/).length;
  const aiLikelihood = Math.min((totalMatches / (wordCount / 100)) * 10, 100);
  
  return {
    aiLikelihood: aiLikelihood.toFixed(1),
    patternsFound: [...new Set(matches)],
    matchCount: totalMatches,
    assessment: aiLikelihood > 50 ? 'High likelihood of AI generation' :
                aiLikelihood > 25 ? 'Moderate AI indicators detected' :
                'Low AI indicators - likely human-written'
  };
};

// Check for filler words
export const detectFillerWords = (text) => {
  const matches = [];
  let totalMatches = 0;
  
  FILLER_PATTERNS.forEach(pattern => {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found);
      totalMatches += found.length;
    }
  });
  
  const wordCount = text.split(/\s+/).length;
  const fillerPercentage = (totalMatches / wordCount) * 100;
  
  return {
    fillerPercentage: fillerPercentage.toFixed(2),
    fillersFound: [...new Set(matches)],
    matchCount: totalMatches,
    assessment: fillerPercentage > 5 ? 'High filler word usage - consider removing' :
                fillerPercentage > 2 ? 'Moderate filler words detected' :
                'Good - minimal filler words'
  };
};

// Basic plagiarism indicators (repetition, generic phrases)
export const detectPlagiarismIndicators = (text) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
  
  const repetitionRatio = sentences.length > 0 
    ? ((sentences.length - uniqueSentences.size) / sentences.length) * 100 
    : 0;
  
  // Check for very generic opening lines
  const genericOpenings = [
    /^(this|the) (essay|article|paper|blog) (will|is going to)/i,
    /^in this (essay|article|paper|blog)/i,
    /^throughout history/i,
    /^since the (beginning|dawn) of time/i,
    /^according to/i
  ];
  
  const hasGenericOpening = genericOpenings.some(pattern => pattern.test(text.trim()));
  
  return {
    repetitionPercentage: repetitionRatio.toFixed(2),
    duplicateSentences: sentences.length - uniqueSentences.size,
    hasGenericOpening,
    plagiarismRisk: repetitionRatio > 20 ? 'High' : 
                    repetitionRatio > 10 ? 'Medium' : 'Low',
    suggestions: [
      repetitionRatio > 10 ? 'Consider varying your sentence structure' : null,
      hasGenericOpening ? 'Consider a more unique opening line' : null
    ].filter(Boolean)
  };
};

// Combined analysis
export const analyzeContent = (text) => {
  return {
    aiDetection: detectAIPatterns(text),
    fillerAnalysis: detectFillerWords(text),
    plagiarismIndicators: detectPlagiarismIndicators(text)
  };
};

export default {
  detectAIPatterns,
  detectFillerWords,
  detectPlagiarismIndicators,
  analyzeContent
};
