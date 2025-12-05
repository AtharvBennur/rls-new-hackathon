import express from 'express';
import { verifyAuthToken, optionalAuth } from '../middleware/verifyAuthToken.js';
import Blog from '../models/Blog.js';
import User from '../models/User.js';

const router = express.Router();

// Create/Save a blog (manual or from draft)
router.post('/', verifyAuthToken, async (req, res) => {
  try {
    const { title, content, tags, category, coverImage, seoMeta, status } = req.body;
    const { uid } = req.user;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Get user info for author
    const user = await User.findOne({ uid });

    const blog = new Blog({
      uid,
      authorName: user?.name || 'Anonymous',
      authorPic: user?.profilePic || '',
      title,
      content,
      tags: tags || [],
      category: category || 'General',
      coverImage: coverImage || '',
      seoMeta: seoMeta || {},
      wordCount: content.split(/\s+/).length,
      isAIGenerated: false,
      status: status || 'draft'
    });

    await blog.save();

    // If published, update user stats
    if (status === 'published' && user) {
      user.totalBlogsPublished += 1;
      const pointsEarned = 20;
      user.addPoints(pointsEarned, 'Blog published');
      await user.save();
    }

    res.json({
      success: true,
      blog: {
        _id: blog._id,
        title: blog.title,
        status: blog.status,
        createdAt: blog.createdAt
      }
    });
  } catch (error) {
    console.error('Save blog error:', error);
    res.status(500).json({ error: 'Failed to save blog' });
  }
});

// Update blog
router.put('/:id', verifyAuthToken, async (req, res) => {
  try {
    const { title, content, tags, category, coverImage, seoMeta, status } = req.body;
    const { uid } = req.user;

    const blog = await Blog.findOne({ _id: req.params.id, uid });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const wasNotPublished = blog.status !== 'published';

    if (title) blog.title = title;
    if (content) {
      blog.content = content;
      blog.wordCount = content.split(/\s+/).length;
    }
    if (tags) blog.tags = tags;
    if (category) blog.category = category;
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (seoMeta) blog.seoMeta = seoMeta;
    if (status) blog.status = status;

    await blog.save();

    // If just published, update user stats
    if (wasNotPublished && status === 'published') {
      const user = await User.findOne({ uid });
      if (user) {
        user.totalBlogsPublished += 1;
        user.addPoints(20, 'Blog published');
        await user.save();
      }
    }

    res.json({
      success: true,
      message: 'Blog updated successfully',
      blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

// Delete blog
router.delete('/:id', verifyAuthToken, async (req, res) => {
  try {
    const result = await Blog.deleteOne({ _id: req.params.id, uid: req.user.uid });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

// Get user's blogs
router.get('/my', verifyAuthToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { uid } = req.user;

    const query = { uid };
    if (status) query.status = status;

    const blogs = await Blog.find(query)
      .sort({ updatedAt: -1 })
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
    console.error('Get my blogs error:', error);
    res.status(500).json({ error: 'Failed to get blogs' });
  }
});

// Get public blog feed
router.get('/feed', optionalAuth, async (req, res) => {
  try {
    const { tag, category, author, sort = 'latest', page = 1, limit = 10 } = req.query;

    const query = { status: 'published' };
    if (tag) query.tags = tag;
    if (category) query.category = category;
    if (author) query.uid = author;

    let sortOption = { publishedAt: -1 };
    if (sort === 'popular') sortOption = { likesCount: -1, viewsCount: -1 };
    if (sort === 'trending') sortOption = { viewsCount: -1, publishedAt: -1 };

    const blogs = await Blog.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-aiReview -generationParams');

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
    console.error('Get blog feed error:', error);
    res.status(500).json({ error: 'Failed to get blog feed' });
  }
});

// Get single blog
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // If not published and not owner, deny access
    if (blog.status !== 'published' && (!req.user || blog.uid !== req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment view count
    blog.viewsCount += 1;
    await blog.save();

    // Check if user has liked/bookmarked
    const userInteraction = req.user ? {
      hasLiked: blog.likedBy.includes(req.user.uid),
      hasBookmarked: blog.bookmarkedBy.includes(req.user.uid)
    } : null;

    res.json({
      success: true,
      blog,
      userInteraction
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ error: 'Failed to get blog' });
  }
});

// Like/Unlike blog
router.post('/:id/like', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const hasLiked = blog.likedBy.includes(uid);

    if (hasLiked) {
      blog.likedBy = blog.likedBy.filter(id => id !== uid);
      blog.likesCount = Math.max(0, blog.likesCount - 1);
    } else {
      blog.likedBy.push(uid);
      blog.likesCount += 1;
    }

    await blog.save();

    res.json({
      success: true,
      liked: !hasLiked,
      likesCount: blog.likesCount
    });
  } catch (error) {
    console.error('Like blog error:', error);
    res.status(500).json({ error: 'Failed to like blog' });
  }
});

// Bookmark/Unbookmark blog
router.post('/:id/bookmark', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const hasBookmarked = blog.bookmarkedBy.includes(uid);

    if (hasBookmarked) {
      blog.bookmarkedBy = blog.bookmarkedBy.filter(id => id !== uid);
      blog.bookmarksCount = Math.max(0, blog.bookmarksCount - 1);
    } else {
      blog.bookmarkedBy.push(uid);
      blog.bookmarksCount += 1;
    }

    await blog.save();

    res.json({
      success: true,
      bookmarked: !hasBookmarked,
      bookmarksCount: blog.bookmarksCount
    });
  } catch (error) {
    console.error('Bookmark blog error:', error);
    res.status(500).json({ error: 'Failed to bookmark blog' });
  }
});

// Get bookmarked blogs
router.get('/user/bookmarks', verifyAuthToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const blogs = await Blog.find({ bookmarkedBy: uid, status: 'published' })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-content -aiReview -generationParams');

    const total = await Blog.countDocuments({ bookmarkedBy: uid, status: 'published' });

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
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to get bookmarks' });
  }
});

export default router;
