const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Бүх постууд авах
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username displayName avatar')
      .populate('comments.user', 'username displayName avatar')
      .populate('comments.replies.user', 'username displayName avatar')
      .populate({
        path: 'repostedPost',
        populate: [
          { path: 'author', select: 'username displayName avatar' },
          { path: 'comments.user', select: 'username displayName avatar' },
          { path: 'comments.replies.user', select: 'username displayName avatar' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Шинэ пост үүсгэх
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const content = req.body.content;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

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
    const post = await Post.findById(req.params.id).populate('author');
    const currentUser = await User.findById(req.userId);
    
    if (post.likes.includes(req.userId)) {
      post.likes = post.likes.filter(id => id.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
      
      // Notification үүсгэх
      if (post.author._id.toString() !== req.userId) {
        await Notification.create({
          recipient: post.author._id,
          actor: req.userId,
          type: 'like',
          post: post._id,
          message: `${currentUser.displayName} таны постыг лайк хийлээ`
        });
      }
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
    const post = await Post.findById(req.params.id).populate('author');
    const currentUser = await User.findById(req.userId);
    
    post.comments.push({
      user: req.userId,
      text: req.body.text
    });

    await post.save();
    await post.populate('comments.user', 'username displayName avatar');
    await post.populate('comments.replies.user', 'username displayName avatar');
    
    // Notification үүсгэх
    if (post.author._id.toString() !== req.userId) {
      await Notification.create({
        recipient: post.author._id,
        actor: req.userId,
        type: 'comment',
        post: post._id,
        message: `${currentUser.displayName} таны постонд сэтгэгдэл бичлээ`
      });
    }
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Comment like хийх - ШИНЭ NOTIFICATION
router.post('/:id/comment/:commentId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const currentUser = await User.findById(req.userId);
    
    if (!post) {
      return res.status(404).json({ message: 'Пост олдсонгүй' });
    }

    const comment = post.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Сэтгэгдэл олдсонгүй' });
    }

    const likeIndex = comment.likes.findIndex(id => id.toString() === req.userId);
    
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(req.userId);
      
      // 🆕 NOTIFICATION үүсгэх - comment-ийн эзэнд
      if (comment.user.toString() !== req.userId) {
        await Notification.create({
          recipient: comment.user,
          actor: req.userId,
          type: 'like',
          post: post._id,
          message: `${currentUser.displayName} таны сэтгэгдлийг лайк хийлээ`
        });
      }
    }

    await post.save();
    await post.populate('comments.user', 'username displayName avatar');
    await post.populate('comments.replies.user', 'username displayName avatar');
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Comment reply нэмэх - ШИНЭ NOTIFICATION
router.post('/:id/comment/:commentId/reply', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const currentUser = await User.findById(req.userId);
    
    if (!post) {
      return res.status(404).json({ message: 'Пост олдсонгүй' });
    }

    const comment = post.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Сэтгэгдэл олдсонгүй' });
    }

    comment.replies.push({
      user: req.userId,
      text: req.body.text
    });

    await post.save();
    await post.populate('comments.user', 'username displayName avatar');
    await post.populate('comments.replies.user', 'username displayName avatar');
    
    // 🆕 NOTIFICATION үүсгэх - comment-ийн эзэнд
    if (comment.user.toString() !== req.userId) {
      await Notification.create({
        recipient: comment.user,
        actor: req.userId,
        type: 'comment',
        post: post._id,
        message: `${currentUser.displayName} таны сэтгэгдэлд хариулт бичлээ`
      });
    }
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Retweet хийх
router.post('/:id/retweet', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author');
    const currentUser = await User.findById(req.userId);
    
    if (post.retweets.includes(req.userId)) {
      post.retweets = post.retweets.filter(id => id.toString() !== req.userId);
    } else {
      post.retweets.push(req.userId);
      
      if (post.author._id.toString() !== req.userId) {
        await Notification.create({
          recipient: post.author._id,
          actor: req.userId,
          type: 'retweet',
          post: post._id,
          message: `${currentUser.displayName} таны постыг дахин бичлээ`
        });
      }
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Repost үүсгэх
router.post('/:id/repost', auth, async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) {
      return res.status(404).json({ message: 'Пост олдсонгүй' });
    }

    const existingRepost = await Post.findOne({
      author: req.userId,
      repostedPost: req.params.id
    });

    if (existingRepost) {
      await Post.findByIdAndDelete(existingRepost._id);
      originalPost.retweets = originalPost.retweets.filter(id => id.toString() !== req.userId);
      await originalPost.save();
      
      res.json({ message: 'Repost устгасан', reposted: false, post: originalPost });
    } else {
      const repost = new Post({
        content: '🔄 Дахин бичсэн пост',
        author: req.userId,
        repostedPost: originalPost._id
      });

      await repost.save();
      originalPost.retweets.push(req.userId);
      await originalPost.save();
      
      await repost.populate('author', 'username displayName avatar');
      await repost.populate({
        path: 'repostedPost',
        populate: [
          { path: 'author', select: 'username displayName avatar' },
          { path: 'comments.user', select: 'username displayName avatar' }
        ]
      });

      res.status(201).json({ message: 'Repost үүсгэсэн', reposted: true, repost, post: originalPost });
    }
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Post үзэх
router.post('/:id/view', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Пост олдсонгүй' });
    }

    if (!post.views.includes(req.userId)) {
      post.views.push(req.userId);
      await post.save();
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Viewers авах
router.get('/:id/viewers', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('views', 'username displayName avatar');
    
    if (!post) {
      return res.status(404).json({ message: 'Пост олдсонгүй' });
    }

    res.json(post.views || []);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Post устгах
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Пост олдсонгүй' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Энэ постыг устгах эрхгүй байна' });
    }

    if (post.repostedPost) {
      const originalPost = await Post.findById(post.repostedPost);
      if (originalPost) {
        originalPost.retweets = originalPost.retweets.filter(id => id.toString() !== req.userId);
        await originalPost.save();
      }
    }

    await Post.deleteMany({ repostedPost: post._id });
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Пост устгасан' });
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Comment устгах
router.delete('/:id/comment/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Пост олдсонгүй' });
    }

    const comment = post.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Сэтгэгдэл олдсонгүй' });
    }

    const isCommentAuthor = comment.user.toString() === req.userId;
    const isPostAuthor = post.author.toString() === req.userId;
    
    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: 'Энэ сэтгэгдлийг устгах эрхгүй байна' });
    }

    post.comments.id(req.params.commentId).deleteOne();
    await post.save();
    
    res.json({ message: 'Сэтгэгдэл устгасан' });
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

module.exports = router;