import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileURL: {
    type: String,
    default: ''
  },
  cloudinaryPublicId: {
    type: String,
    default: ''
  },
  extractedText: {
    type: String,
    default: ''
  },
  textStats: {
    wordCount: Number,
    characterCount: Number,
    sentenceCount: Number,
    paragraphCount: Number
  },
  // AI Evaluation Results
  score: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  detailedFeedback: {
    rating: String,
    feedback: String,
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    improvedVersion: String
  },
  // Plagiarism & AI Detection
  plagiarismAnalysis: {
    aiLikelihood: String,
    patternsFound: [String],
    plagiarismRisk: String,
    repetitionPercentage: String
  },
  // Metadata
  uploadDate: {
    type: Date,
    default: Date.now
  },
  evaluatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  }
});

// Index for efficient queries
assignmentSchema.index({ uid: 1, uploadDate: -1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
