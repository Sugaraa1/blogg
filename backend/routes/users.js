const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
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

// Follow хийх
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToFollow.followers.includes(req.userId)) {
      userToFollow.followers.push(req.userId);
      currentUser.following.push(req.params.id);
      
      await userToFollow.save();
      await currentUser.save();
    }

    res.json({ message: 'Follow амжилттай' });
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

module.exports = router;