const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Мэдэгдлүүдийг авах
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .populate('actor', 'username displayName avatar')
      .populate('post', 'content')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Мэдэгдэл татахад алдаа', error: error.message });
  }
});

// Мэдэгдлийг уншсан гэж тэмдэглэх
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Мэдэгдлийг шинэчлэхэд алдаа', error: error.message });
  }
});

// Бүх мэдэгдлийг уншсан гэж тэмдэглэх
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId },
      { read: true }
    );
    res.json({ message: 'Бүх мэдэгдлийг уншсан гэж тэмдэглэв' });
  } catch (error) {
    res.status(500).json({ message: 'Алдаа', error: error.message });
  }
});

// Мэдэгдлийн тоо авах
router.get('/count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.userId,
      read: false
    });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Алдаа', error: error.message });
  }
});

module.exports = router;
