const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// 🆕 Block хийх
router.post('/:id/block', auth, async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ message: 'Өөрийгөө block хийж болохгүй' });
    }

    const userToBlock = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToBlock) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const isBlocked = currentUser.blockedUsers.includes(req.params.id);

    if (isBlocked) {
      // Unblock хийх
      currentUser.blockedUsers = currentUser.blockedUsers.filter(
        id => id.toString() !== req.params.id
      );
      
      await currentUser.save();
      
      res.json({ message: 'Unblock амжилттай', isBlocked: false });
    } else {
      // Block хийх
      currentUser.blockedUsers.push(req.params.id);
      
      // Block хийхэд автоматаар unfollow хийгдэнэ
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== req.params.id
      );
      userToBlock.followers = userToBlock.followers.filter(
        id => id.toString() !== req.userId
      );
      
      await currentUser.save();
      await userToBlock.save();
      
      res.json({ message: 'Block амжилттай', isBlocked: true });
    }
  } catch (error) {
    console.error('Block хийхэд алдаа:', error);
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// 🆕 Block статус шалгах
router.get('/:id/block-status', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const isBlocked = currentUser.blockedUsers.includes(req.params.id);
    
    res.json({ isBlocked });
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Trending хэрэглэгчүүд авах (/:username-ээс өмнө)
router.get('/trending', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    
    const users = await User.find({
      _id: { 
        $ne: req.userId,
        $nin: currentUser.following
      }
    })
      .select('username displayName avatar bio followers following')
      .sort({ 'followers': -1 })
      .limit(20);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 50;

    let findQuery = { _id: { $ne: req.userId } };
    
    if (query.trim()) {
      findQuery.$or = [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ];
    }

    const users = await User.find(findQuery)
      .select('_id username displayName avatar bio followers following')
      .limit(limit);

    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Profile авах - ✅ ЗАСВАРЛАСАН: blockedUsers populate нэмсэн
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username displayName avatar')
      .populate('following', '_id username displayName avatar')
      .populate('blockedUsers', 'username displayName avatar'); // ✅ НЭМСЭН

    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Хэрэглэгчийн постууд авах
router.get('/:username/posts', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const posts = await Post.find({ author: user._id })
      .populate('author', 'username displayName avatar')
      .populate('comments.user', 'username displayName avatar')
      .populate({
        path: 'repostedPost',
        populate: [
          { path: 'author', select: 'username displayName avatar' },
          { path: 'comments.user', select: 'username displayName avatar' }
        ]
      })
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Profile засварлах (bio, avatar, coverImage)
router.put('/profile', auth, async (req, res) => {
  try {
    const { bio, avatar, coverImage } = req.body;
    
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (coverImage !== undefined) updateData.coverImage = coverImage;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Follow хийх
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ message: 'Өөрийгөө follow хийж болохгүй' });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToFollow) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      userToFollow.followers = userToFollow.followers.filter(
        id => id.toString() !== req.userId
      );
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== req.params.id
      );
      
      await userToFollow.save();
      await currentUser.save();
      
      res.json({ message: 'Unfollow амжилттай', isFollowing: false });
    } else {
      userToFollow.followers.push(req.userId);
      currentUser.following.push(req.params.id);
      
      await userToFollow.save();
      await currentUser.save();
      
      await Notification.create({
        recipient: req.params.id,
        actor: req.userId,
        type: 'follow',
        message: `${currentUser.displayName} таныг follow хийлээ`
      });
      
      res.json({ message: 'Follow амжилттай', isFollowing: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Follow статус шалгах
router.get('/:id/follow-status', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const isFollowing = currentUser.following.includes(req.params.id);
    
    res.json({ isFollowing });
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

module.exports = router;