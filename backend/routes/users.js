const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Profile авах
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username displayName avatar')
      .populate('following', 'username displayName avatar');
    
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
      // Unfollow хийх
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
      // Follow хийх
      userToFollow.followers.push(req.userId);
      currentUser.following.push(req.params.id);
      
      await userToFollow.save();
      await currentUser.save();
      
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