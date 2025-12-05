import express from 'express';
import { generateBlog as aiGenerateBlog, reviewBlog as aiReviewBlog } from '../services/groqClient.js';
import { analyzeContent } from '../utils/plagiarismCheck.js';
import { verifyAuthToken } from '../middleware/verifyAuthToken.js';
import Blog from '../models/Blog.js';
import User from '../models/User.js';

const router = express.Router();

// Generate blog/essay
router.post('/generate', verifyAuthToken, async (req, res) => {
  try {
    const { topic, keywords, audience, length, tone } = req.body;
    const { uid } = req.user;

    if (!topic || topic.length < 5) {
      return res.status(400).json({ error: 'Topic must be at least 5 characters long' });
    }

    // Parse keywords
    const keywordArray = keywords 
      ? (Array.isArray(keywords) ? keywords : keywords.split(',').map(k => k.trim()))
      : [];

    // Generate blog
    const generatedBlog = await aiGenerateBlog({
      topic,
      keywords: keywordArray,
      audience: audience || 'general readers',
      length: parseInt(length) || 500,
      tone: tone || 'informational'
    });

    // Analyze content
    const contentAnalysis = analyzeContent(generatedBlog.content || '');

    // Create blog (as draft)
    const blog = new Blog({
      uid,
      title: generatedBlog.title || topic,
      content: generatedBlog.content || '',
      tags: generatedBlog.tags || keywordArray,
      seoMeta: {
        metaTitle: generatedBlog.metaTitle || generatedBlog.title,
        metaDescription: generatedBlog.metaDescription || ''
      },
      readabilityGrade: generatedBlog.readabilityGrade || '',
      wordCount: generatedBlog.wordCount || 0,
      isAIGenerated: true,
      generationParams: {
        topic,
        keywords: keywordArray,
        audience,
        tone,
        requestedLength: parseInt(length) || 500
      },
      status: 'draft'
    });
    await blog.save();

    res.json({
      success: true,
      blogId: blog._id,
      blog: {
        title: blog.title,
        content: blog.content,
        seoMeta: blog.seoMeta,
        tags: blog.tags,
        readabilityGrade: blog.readabilityGrade,
        wordCount: blog.wordCount,
        citations: generatedBlog.citations || []
      },
      contentAnalysis
    });
  } catch (error) {
    console.error('Generate blog error:', error);
    res.status(500).json({ error: 'Failed to generate blog: ' + error.message });
  }
});

// AI Review before posting
router.post('/review', verifyAuthToken, async (req, res) => {
  try {
    const { content, blogId } = req.body;

    if (!content || content.length < 100) {
      return res.status(400).json({ error: 'Content must be at least 100 characters long' });
    }

    // Get AI review
    const review = await aiReviewBlog(content);

    // Analyze content
    const contentAnalysis = analyzeContent(content);

    // If blogId provided, update the blog with review
    if (blogId) {
      const blog = await Blog.findOne({ _id: blogId, uid: req.user.uid });
      if (blog) {
        blog.aiReview = {
          rating: review.rating,
          feedback: review.feedback,
          strengths: review.strengths || [],
          weaknesses: review.weaknesses || [],
          suggestions: review.suggestions || []
        };
        await blog.save();
      }
    }

    res.json({
      success: true,
      review: {
        rating: review.rating,
        feedback: review.feedback,
        strengths: review.strengths || [],
        weaknesses: review.weaknesses || [],
        suggestions: review.suggestions || [],
        improvedVersion: review.improved_version || ''
      },
      contentAnalysis: {
        aiDetection: contentAnalysis.aiDetection,
        plagiarismIndicators: contentAnalysis.plagiarismIndicators
      }
    });
  } catch (error) {
    console.error('Review blog error:', error);
    res.status(500).json({ error: 'Failed to review blog: ' + error.message });
  }
});

// Plagiarism & AI detection check
router.post('/check', verifyAuthToken, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.length < 50) {
      return res.status(400).json({ error: 'Content must be at least 50 characters long' });
    }

    const analysis = analyzeContent(content);

    res.json({
      success: true,
      analysis: {
        aiDetection: {
          likelihood: analysis.aiDetection.aiLikelihood,
          assessment: analysis.aiDetection.assessment,
          patternsFound: analysis.aiDetection.patternsFound
        },
        plagiarism: {
          risk: analysis.plagiarismIndicators.plagiarismRisk,
          repetitionPercentage: analysis.plagiarismIndicators.repetitionPercentage,
          suggestions: analysis.plagiarismIndicators.suggestions
        },
        filler: {
          percentage: analysis.fillerAnalysis.fillerPercentage,
          assessment: analysis.fillerAnalysis.assessment,
          found: analysis.fillerAnalysis.fillersFound
        }
      }
    });
  } catch (error) {
    console.error('Check content error:', error);
    res.status(500).json({ error: 'Failed to check content: ' + error.message });
  }
});

export default router;
