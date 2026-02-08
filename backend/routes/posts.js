const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Бүх постууд авах
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username displayName avatar')
      .populate('comments.user', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Шинэ пост үүсгэх
router.post('/', auth, async (req, res) => {
  try {
    const { content, image } = req.body;

    const post = new Post({
      content,
      image,
      author: req.userId
    });

    await post.save();
    await post.populate('author', 'username displayName avatar');

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Like хийх
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (post.likes.includes(req.userId)) {
      post.likes = post.likes.filter(id => id.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Comment нэмэх
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    post.comments.push({
      user: req.userId,
      text: req.body.text
    });

    await post.save();
    await post.populate('comments.user', 'username displayName avatar');
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

module.exports = router;