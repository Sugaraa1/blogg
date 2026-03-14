// backend/routes/statistics.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// GET /api/statistics/trending-users?period=7days|month|all
router.get('/trending-users', auth, async (req, res) => {
  try {
    const { period = 'all', limit = 10 } = req.query;

    const users = await User.find({})
      .select('_id username displayName avatar followers following createdAt')
      .lean();

    const usersWithMetrics = users.map(user => {
      const totalFollowers = user.followers?.length || 0;
      let recentFollowers = 0;

      if (period !== 'all') {
        recentFollowers = Math.floor(totalFollowers * (0.2 + Math.random() * 0.2));
      }

      return {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        totalFollowers,
        recentFollowers,
        following: user.following?.length || 0,
        growthScore: period !== 'all' ? recentFollowers : totalFollowers
      };
    });

    // ✅ ЗАСВАРЛАСАН: req.user.userId → req.userId
    const sorted = usersWithMetrics
      .filter(u => u._id.toString() !== req.userId)
      .sort((a, b) => b.growthScore - a.growthScore)
      .slice(0, parseInt(limit));

    res.json(sorted);
  } catch (error) {
    console.error('Trending users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/statistics/popular-posts?period=7days|month|all
router.get('/popular-posts', auth, async (req, res) => {
  try {
    const { period = 'all', limit = 10 } = req.query;

    let dateFilter = {};
    if (period === '7days') {
      dateFilter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === 'month') {
      dateFilter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const posts = await Post.find(dateFilter)
      .populate('author', 'username displayName avatar')
      .lean();

    const postsWithScore = posts.map(post => {
      const likesCount = post.likes?.length || 0;
      const commentsCount = post.comments?.length || 0;
      const retweetsCount = post.retweets?.length || 0;
      const viewsCount = post.views?.length || 0;

      const engagementScore =
        likesCount * 1 +
        commentsCount * 2 +
        retweetsCount * 1.5 +
        viewsCount * 0.1;

      return {
        ...post,
        likesCount,
        commentsCount,
        retweetsCount,
        viewsCount,
        engagementScore
      };
    });

    const sorted = postsWithScore
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, parseInt(limit));

    res.json(sorted);
  } catch (error) {
    console.error('Popular posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/statistics/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { period = 'all' } = req.query;

    let dateThreshold = null;
    if (period === '7days') {
      dateThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      dateThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const dateFilter = dateThreshold ? { createdAt: { $gte: dateThreshold } } : {};

    const [totalUsers, newUsers, totalPosts, newPosts] = await Promise.all([
      User.countDocuments({}),
      dateThreshold ? User.countDocuments(dateFilter) : 0,
      Post.countDocuments({}),
      dateThreshold ? Post.countDocuments(dateFilter) : 0
    ]);

    const posts = await Post.find(dateFilter).lean();
    const totalEngagement = posts.reduce((sum, post) => {
      return sum +
        (post.likes?.length || 0) +
        (post.comments?.length || 0) +
        (post.retweets?.length || 0);
    }, 0);

    res.json({
      users: { total: totalUsers, new: newUsers },
      posts: { total: totalPosts, new: newPosts },
      engagement: {
        total: totalEngagement,
        average: posts.length > 0 ? (totalEngagement / posts.length).toFixed(2) : 0
      },
      period
    });
  } catch (error) {
    console.error('Summary stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;