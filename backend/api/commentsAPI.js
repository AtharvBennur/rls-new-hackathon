import express from 'express';
import { checkToxicity } from '../services/groqClient.js';
import { verifyAuthToken, optionalAuth } from '../middleware/verifyAuthToken.js';
import Comment from '../models/Comment.js';
import Blog from '../models/Blog.js';
import User from '../models/User.js';

const router = express.Router();

// Add comment to blog
router.post('/:blogId', verifyAuthToken, async (req, res) => {
  try {
    const { comment, parentCommentId } = req.body;
    const { blogId } = req.params;
    const { uid } = req.user;

    if (!comment || comment.trim().length < 1) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    if (comment.length > 2000) {
      return res.status(400).json({ error: 'Comment must be less than 2000 characters' });
    }

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog || blog.status !== 'published') {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Get user info
    const user = await User.findOne({ uid });

    // Check toxicity
    const toxicityResult = await checkToxicity(comment);

    // Create comment
    const newComment = new Comment({
      blogId,
      uid,
      authorName: user?.name || 'Anonymous',
      authorPic: user?.profilePic || '',
      comment: comment.trim(),
      toxicityAnalysis: toxicityResult,
      status: toxicityResult.isToxic || toxicityResult.isHateSpeech ? 'flagged' : 'approved',
      parentCommentId: parentCommentId || null
    });

    await newComment.save();

    // Update blog comment count
    blog.commentsCount += 1;
    await blog.save();

    // If it's a reply, update parent comment
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, { $inc: { repliesCount: 1 } });
    }

    res.json({
      success: true,
      comment: newComment,
      warning: toxicityResult.isToxic ? 'Your comment has been flagged for review' : null
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get comments for a blog
router.get('/:blogId', optionalAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { page = 1, limit = 20, sort = 'latest' } = req.query;

    // Only get approved and non-reply comments
    const query = { 
      blogId, 
      status: { $in: ['approved', 'flagged'] },
      parentCommentId: null 
    };

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'popular') sortOption = { likesCount: -1, createdAt: -1 };

    const comments = await Comment.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments(query);

    // Get replies for each comment (limited to 3)
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ 
          parentCommentId: comment._id,
          status: { $in: ['approved', 'flagged'] }
        })
          .sort({ createdAt: 1 })
          .limit(3);
        
        return {
          ...comment.toObject(),
          replies,
          hasMoreReplies: comment.repliesCount > 3
        };
      })
    );

    res.json({
      success: true,
      comments: commentsWithReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// Get replies for a comment
router.get('/:blogId/replies/:commentId', optionalAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const replies = await Comment.find({ 
      parentCommentId: commentId,
      status: { $in: ['approved', 'flagged'] }
    })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({ 
      parentCommentId: commentId,
      status: { $in: ['approved', 'flagged'] }
    });

    res.json({
      success: true,
      replies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ error: 'Failed to get replies' });
  }
});

// Like/Unlike comment
router.post('/:blogId/like/:commentId', verifyAuthToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { uid } = req.user;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const hasLiked = comment.likedBy.includes(uid);

    if (hasLiked) {
      comment.likedBy = comment.likedBy.filter(id => id !== uid);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      comment.likedBy.push(uid);
      comment.likesCount += 1;
    }

    await comment.save();

    res.json({
      success: true,
      liked: !hasLiked,
      likesCount: comment.likesCount
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Delete comment (own comment only)
router.delete('/:blogId/:commentId', verifyAuthToken, async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const { uid } = req.user;

    const comment = await Comment.findOne({ _id: commentId, uid });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found or not authorized' });
    }

    // Update blog comment count
    await Blog.findByIdAndUpdate(blogId, { $inc: { commentsCount: -1 } });

    // If it was a reply, update parent
    if (comment.parentCommentId) {
      await Comment.findByIdAndUpdate(comment.parentCommentId, { $inc: { repliesCount: -1 } });
    }

    await Comment.deleteOne({ _id: commentId });

    res.json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Report comment
router.post('/:blogId/report/:commentId', verifyAuthToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Re-check toxicity with the report context
    const toxicityResult = await checkToxicity(comment.comment);

    if (toxicityResult.isToxic || toxicityResult.isHateSpeech || toxicityResult.toxicityScore > 0.5) {
      comment.status = 'flagged';
      comment.toxicityAnalysis = toxicityResult;
      await comment.save();
    }

    res.json({
      success: true,
      message: 'Comment reported successfully'
    });
  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({ error: 'Failed to report comment' });
  }
});

export default router;
