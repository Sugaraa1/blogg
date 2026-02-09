const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all conversations for current user (latest message with each user)
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get all unique users the current user has messaged
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate('sender', '_id username displayName avatar')
      .populate('receiver', '_id username displayName avatar')
      .sort({ createdAt: -1 });

    // Group by conversation partner
    const conversationsMap = new Map();
    messages.forEach(msg => {
      const partnerId = msg.sender._id.toString() === userId ? msg.receiver._id : msg.sender._id;
      const partnerIdStr = partnerId.toString();
      
      if (!conversationsMap.has(partnerIdStr)) {
        const partner = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
        conversationsMap.set(partnerIdStr, {
          id: partnerId,
          username: partner.username,
          displayName: partner.displayName,
          avatar: partner.avatar,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: 0
        });
      }
      
      // Count unread messages
      if (msg.receiver._id.toString() === userId && !msg.read) {
        conversationsMap.get(partnerIdStr).unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages between two users
router.get('/:partnerId', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { partnerId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId }
      ]
    })
      .populate('sender', '_id username displayName avatar')
      .populate('receiver', '_id username displayName avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { receiver, content, image } = req.body;
    const sender = req.userId;

    if (!content && !image) {
      return res.status(400).json({ error: 'Message content or image required' });
    }

    const message = new Message({
      sender,
      receiver,
      content,
      image
    });

    await message.save();
    await message.populate('sender', '_id username displayName avatar');
    await message.populate('receiver', '_id username displayName avatar');

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark message as read
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { read: true },
      { new: true }
    )
      .populate('sender', '_id username displayName avatar')
      .populate('receiver', '_id username displayName avatar');

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all messages from a user as read
router.put('/user/:userId/read-all', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { userId: partnerId } = req.params;

    await Message.updateMany(
      { sender: partnerId, receiver: userId, read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread message count
router.get('/count/unread', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const unreadCount = await Message.countDocuments({
      receiver: userId,
      read: false
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
