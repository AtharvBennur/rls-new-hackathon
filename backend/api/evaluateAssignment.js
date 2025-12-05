import express from 'express';
import { uploadDocument } from '../services/cloudinaryClient.js';
import { extractTextFromPDFUrl, cleanText, getTextStats } from '../utils/textExtract.js';
import { analyzeContent } from '../utils/plagiarismCheck.js';
import { evaluateAssignment as aiEvaluate } from '../services/groqClient.js';
import { verifyAuthToken } from '../middleware/verifyAuthToken.js';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';

const router = express.Router();

// Upload and evaluate assignment
router.post('/', verifyAuthToken, uploadDocument.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { uid } = req.user;
    const fileURL = req.file.path;
    const fileName = req.file.originalname;
    const cloudinaryPublicId = req.file.filename;

    // Create assignment record
    const assignment = new Assignment({
      uid,
      fileName,
      fileURL,
      cloudinaryPublicId,
      status: 'processing'
    });
    await assignment.save();

    // Extract text from PDF
    console.log('Extracting text from file:', fileURL);
    let extractedData;
    try {
      extractedData = await extractTextFromPDFUrl(fileURL);
      console.log('Text extracted successfully, length:', extractedData.text?.length || 0);
    } catch (extractError) {
      console.error('Text extraction failed:', extractError.message);
      assignment.status = 'failed';
      await assignment.save();
      return res.status(400).json({ 
        error: 'Failed to extract text from PDF. The file might be corrupted or password protected.',
        assignmentId: assignment._id
      });
    }

    const cleanedText = cleanText(extractedData.text);
    const textStats = getTextStats(cleanedText);
    console.log('Cleaned text length:', cleanedText.length, 'Stats:', textStats);

    if (cleanedText.length < 50) {
      assignment.status = 'failed';
      await assignment.save();
      return res.status(400).json({ 
        error: 'The document contains too little text to evaluate. Please upload a document with more content.',
        assignmentId: assignment._id
      });
    }

    // Analyze for plagiarism/AI patterns
    const contentAnalysis = analyzeContent(cleanedText);

    // AI Evaluation
    console.log('Starting AI evaluation...');
    const aiEvaluation = await aiEvaluate(cleanedText);
    console.log('AI evaluation completed, score:', aiEvaluation.rating);

    // Parse score
    const score = parseFloat(aiEvaluation.rating) || 0;

    // Update assignment with results
    assignment.extractedText = cleanedText.substring(0, 10000); // Store first 10k chars
    assignment.textStats = textStats;
    assignment.score = score;
    assignment.detailedFeedback = {
      rating: aiEvaluation.rating,
      feedback: aiEvaluation.feedback,
      strengths: aiEvaluation.strengths || [],
      weaknesses: aiEvaluation.weaknesses || [],
      suggestions: aiEvaluation.suggestions || [],
      improvedVersion: aiEvaluation.improved_version || ''
    };
    assignment.plagiarismAnalysis = {
      aiLikelihood: contentAnalysis.aiDetection.aiLikelihood,
      patternsFound: contentAnalysis.aiDetection.patternsFound,
      plagiarismRisk: contentAnalysis.plagiarismIndicators.plagiarismRisk,
      repetitionPercentage: contentAnalysis.plagiarismIndicators.repetitionPercentage
    };
    assignment.status = 'completed';
    assignment.evaluatedAt = new Date();
    await assignment.save();

    // Update user stats
    const user = await User.findOne({ uid });
    if (user) {
      user.totalAssignmentsEvaluated += 1;
      // Update average score
      const totalScore = (user.averageScore * (user.totalAssignmentsEvaluated - 1)) + score;
      user.averageScore = totalScore / user.totalAssignmentsEvaluated;
      // Add points (10 base + bonus for high scores)
      const pointsEarned = 10 + Math.floor(score);
      const newBadges = user.addPoints(pointsEarned, 'Assignment evaluation');
      await user.save();

      res.json({
        success: true,
        assignmentId: assignment._id,
        evaluation: {
          fileName,
          fileURL,
          score,
          textStats,
          feedback: assignment.detailedFeedback,
          plagiarismAnalysis: assignment.plagiarismAnalysis,
          contentAnalysis
        },
        gamification: {
          pointsEarned,
          totalPoints: user.points,
          level: user.level,
          newBadges
        }
      });
    } else {
      res.json({
        success: true,
        assignmentId: assignment._id,
        evaluation: {
          fileName,
          fileURL,
          score,
          textStats,
          feedback: assignment.detailedFeedback,
          plagiarismAnalysis: assignment.plagiarismAnalysis,
          contentAnalysis
        }
      });
    }
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate assignment: ' + error.message });
  }
});

// Evaluate text directly (without file upload)
router.post('/text', verifyAuthToken, async (req, res) => {
  try {
    const { text, title } = req.body;
    const { uid } = req.user;

    if (!text || text.length < 50) {
      return res.status(400).json({ error: 'Text must be at least 50 characters long' });
    }

    const cleanedText = cleanText(text);
    const textStats = getTextStats(cleanedText);

    // Analyze for plagiarism/AI patterns
    const contentAnalysis = analyzeContent(cleanedText);

    // AI Evaluation
    const aiEvaluation = await aiEvaluate(cleanedText);
    const score = parseFloat(aiEvaluation.rating) || 0;

    // Save to database
    const assignment = new Assignment({
      uid,
      fileName: title || 'Text Evaluation',
      fileURL: '',
      extractedText: cleanedText.substring(0, 10000),
      textStats,
      score,
      detailedFeedback: {
        rating: aiEvaluation.rating,
        feedback: aiEvaluation.feedback,
        strengths: aiEvaluation.strengths || [],
        weaknesses: aiEvaluation.weaknesses || [],
        suggestions: aiEvaluation.suggestions || [],
        improvedVersion: aiEvaluation.improved_version || ''
      },
      plagiarismAnalysis: {
        aiLikelihood: contentAnalysis.aiDetection.aiLikelihood,
        patternsFound: contentAnalysis.aiDetection.patternsFound,
        plagiarismRisk: contentAnalysis.plagiarismIndicators.plagiarismRisk,
        repetitionPercentage: contentAnalysis.plagiarismIndicators.repetitionPercentage
      },
      status: 'completed',
      evaluatedAt: new Date()
    });
    await assignment.save();

    // Update user stats
    const user = await User.findOne({ uid });
    if (user) {
      user.totalAssignmentsEvaluated += 1;
      const totalScore = (user.averageScore * (user.totalAssignmentsEvaluated - 1)) + score;
      user.averageScore = totalScore / user.totalAssignmentsEvaluated;
      const pointsEarned = 10 + Math.floor(score);
      const newBadges = user.addPoints(pointsEarned, 'Text evaluation');
      await user.save();
    }

    res.json({
      success: true,
      assignmentId: assignment._id,
      evaluation: {
        score,
        textStats,
        feedback: assignment.detailedFeedback,
        plagiarismAnalysis: assignment.plagiarismAnalysis,
        contentAnalysis
      }
    });
  } catch (error) {
    console.error('Text evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate text: ' + error.message });
  }
});

// Get single assignment
router.get('/:id', verifyAuthToken, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ 
      _id: req.params.id, 
      uid: req.user.uid 
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ success: true, assignment });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Failed to get assignment' });
  }
});

export default router;
