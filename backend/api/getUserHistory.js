import express from 'express';
import { verifyAuthToken } from '../middleware/verifyAuthToken.js';
import { getLearningRecommendations } from '../services/groqClient.js';
import Assignment from '../models/Assignment.js';
import Blog from '../models/Blog.js';
import User from '../models/User.js';

const router = express.Router();

// Get assignment history
router.get('/assignments', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { page = 1, limit = 10, status } = req.query;

    const query = { uid };
    if (status) query.status = status;

    const assignments = await Assignment.find(query)
      .sort({ uploadDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-extractedText');

    const total = await Assignment.countDocuments(query);

    res.json({
      success: true,
      assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get assignment history error:', error);
    res.status(500).json({ error: 'Failed to get assignment history' });
  }
});

// Get single assignment detail
router.get('/assignments/:id', verifyAuthToken, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      uid: req.user.uid
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Get assignment detail error:', error);
    res.status(500).json({ error: 'Failed to get assignment detail' });
  }
});

// Delete assignment
router.delete('/assignments/:id', verifyAuthToken, async (req, res) => {
  try {
    const result = await Assignment.deleteOne({
      _id: req.params.id,
      uid: req.user.uid
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({
      success: true,
      message: 'Assignment deleted'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// Get blog history
router.get('/blogs', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { page = 1, limit = 10, status } = req.query;

    const query = { uid };
    if (status) query.status = status;

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-content');

    const total = await Blog.countDocuments(query);

    res.json({
      success: true,
      blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get blog history error:', error);
    res.status(500).json({ error: 'Failed to get blog history' });
  }
});

// Get user dashboard stats
router.get('/dashboard', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Get user
    const user = await User.findOne({ uid });

    // Get assignment stats
    const totalAssignments = await Assignment.countDocuments({ uid });
    const completedAssignments = await Assignment.countDocuments({ uid, status: 'completed' });
    
    // Get recent assignments
    const recentAssignments = await Assignment.find({ uid })
      .sort({ uploadDate: -1 })
      .limit(5)
      .select('fileName score uploadDate status');

    // Get score distribution
    const scoreDistribution = await Assignment.aggregate([
      { $match: { uid, status: 'completed' } },
      {
        $bucket: {
          groupBy: '$score',
          boundaries: [0, 3, 5, 7, 9, 11],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    // Get blog stats
    const totalBlogs = await Blog.countDocuments({ uid });
    const publishedBlogs = await Blog.countDocuments({ uid, status: 'published' });
    const totalLikes = await Blog.aggregate([
      { $match: { uid } },
      { $group: { _id: null, total: { $sum: '$likesCount' } } }
    ]);

    // Get recent blogs
    const recentBlogs = await Blog.find({ uid })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status likesCount createdAt');

    res.json({
      success: true,
      dashboard: {
        user: user ? {
          name: user.name,
          level: user.level,
          points: user.points,
          badges: user.badges,
          averageScore: user.averageScore
        } : null,
        assignments: {
          total: totalAssignments,
          completed: completedAssignments,
          recent: recentAssignments,
          scoreDistribution
        },
        blogs: {
          total: totalBlogs,
          published: publishedBlogs,
          totalLikes: totalLikes[0]?.total || 0,
          recent: recentBlogs
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get AI learning recommendations
router.get('/recommendations', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Get recent evaluations
    const recentAssignments = await Assignment.find({ uid, status: 'completed' })
      .sort({ uploadDate: -1 })
      .limit(10)
      .select('score detailedFeedback plagiarismAnalysis');

    if (recentAssignments.length === 0) {
      return res.json({
        success: true,
        recommendations: null,
        message: 'Complete some assignments first to get personalized recommendations'
      });
    }

    // Prepare history summary for AI
    const historySummary = recentAssignments.map(a => ({
      score: a.score,
      strengths: a.detailedFeedback?.strengths || [],
      weaknesses: a.detailedFeedback?.weaknesses || [],
      aiLikelihood: a.plagiarismAnalysis?.aiLikelihood
    }));

    const recommendations = await getLearningRecommendations(historySummary);

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get progress over time
router.get('/progress', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const progress = await Assignment.aggregate([
      {
        $match: {
          uid,
          status: 'completed',
          uploadDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$uploadDate' }
          },
          averageScore: { $avg: '$score' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      progress,
      period: parseInt(period)
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress data' });
  }
});

export default router;
