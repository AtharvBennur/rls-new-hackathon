import express from 'express';
import User from '../models/User.js';
import { verifyAuthToken } from '../middleware/verifyAuthToken.js';

const router = express.Router();

// Create or update user profile after Firebase auth
router.post('/sync', verifyAuthToken, async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;
    const { bio, theme } = req.body;

    let user = await User.findOne({ uid });

    if (user) {
      // Update existing user
      user.email = email;
      if (name) user.name = name;
      if (picture) user.profilePic = picture;
      if (bio !== undefined) user.bio = bio;
      if (theme) user.theme = theme;
      await user.save();
    } else {
      // Create new user
      user = new User({
        uid,
        email,
        name: name || email.split('@')[0],
        profilePic: picture || '',
        bio: bio || '',
        theme: theme || 'system'
      });
      await user.save();
    }

    res.json({
      success: true,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        points: user.points,
        level: user.level,
        badges: user.badges,
        totalAssignmentsEvaluated: user.totalAssignmentsEvaluated,
        totalBlogsPublished: user.totalBlogsPublished,
        averageScore: user.averageScore,
        theme: user.theme,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Auth sync error:', error);
    res.status(500).json({ error: 'Failed to sync user profile' });
  }
});

// Get current user profile
router.get('/profile', verifyAuthToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        points: user.points,
        level: user.level,
        badges: user.badges,
        totalAssignmentsEvaluated: user.totalAssignmentsEvaluated,
        totalBlogsPublished: user.totalBlogsPublished,
        averageScore: user.averageScore,
        theme: user.theme,
        emailVerified: req.user.emailVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', verifyAuthToken, async (req, res) => {
  try {
    const { name, bio, theme, profilePic, emailNotifications } = req.body;

    const user = await User.findOne({ uid: req.user.uid });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (theme !== undefined) user.theme = theme;
    if (profilePic !== undefined) user.profilePic = profilePic;
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        theme: user.theme,
        emailNotifications: user.emailNotifications
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user stats and gamification data
router.get('/stats', verifyAuthToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate progress to next level
    const pointsPerLevel = 100;
    const pointsInCurrentLevel = user.points % pointsPerLevel;
    const progressToNextLevel = (pointsInCurrentLevel / pointsPerLevel) * 100;

    res.json({
      success: true,
      stats: {
        points: user.points,
        level: user.level,
        badges: user.badges,
        totalAssignmentsEvaluated: user.totalAssignmentsEvaluated,
        totalBlogsPublished: user.totalBlogsPublished,
        averageScore: user.averageScore,
        progressToNextLevel: progressToNextLevel.toFixed(1),
        pointsToNextLevel: pointsPerLevel - pointsInCurrentLevel
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
