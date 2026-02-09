const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer setup to store uploaded images in /uploads
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
      .populate({
        path: 'repostedPost',
        populate: [
          { path: 'author', select: 'username displayName avatar' },
          { path: 'comments.user', select: 'username displayName avatar' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Шинэ пост үүсгэх (файлын upload-д дэмжлэг)
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
      
      // Notification үүсгэх (өөрийнхөө постыг лайк хийсэн бол мэдэгдэл илгээхгүй)
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
    
    // Notification үүсгэх (өөрийнхөө постыг comment хийсэн бол мэдэгдэл илгээхгүй)
    if (post.author._id.toString() !== req.userId) {
      await Notification.create({
        recipient: post.author._id,
        actor: req.userId,
        type: 'comment',
        post: post._id,
        message: `${currentUser.displayName} таны постыг сэтгэгдэл бичлээ`
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
      
      // Notification үүсгэх (өөрийнхөө постыг retweet хийсэн бол мэдэгдэл илгээхгүй)
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

// Repost үүсгэх (профилд харагдах)
router.post('/:id/repost', auth, async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) {
      return res.status(404).json({ message: 'Пост олдсонгүй' });
    }

    // Аль хэдийн repost хийсэн эсэх шалгах
    const existingRepost = await Post.findOne({
      author: req.userId,
      repostedPost: req.params.id
    });

    if (existingRepost) {
      // Repost устгах
      await Post.findByIdAndDelete(existingRepost._id);
      
      // Original post-ийн retweets array-ээс устгах
      originalPost.retweets = originalPost.retweets.filter(id => id.toString() !== req.userId);
      await originalPost.save();
      
      res.json({ message: 'Repost устгасан', reposted: false, post: originalPost });
    } else {
      // Шинэ repost үүсгэх
      const repost = new Post({
        content: '🔄 Дахин бичсэн пост',
        author: req.userId,
        repostedPost: originalPost._id
      });

      await repost.save();
      
      // Original post-ийн retweets array-д нэмэх
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

// Post үзэх (View recording)
router.post('/:id/view', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Пост олдсонгүй' });
    }

    // Аль хэдийн үзсэн эсэх шалгах
    if (!post.views.includes(req.userId)) {
      post.views.push(req.userId);
      await post.save();
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Postыг үзсэн хүмүүсийг авах
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

// Post устгах (зөвхөн автор)
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Пост олдсонгүй' });
    }

    // Зөвхөн постын зохиогч устгаж болно
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Энэ постыг устгах эрхгүй байна' });
    }

    // Хэрэв энэ пост repost бол (repostedPost байгаа) original post-ийн retweets-ээс хасах
    if (post.repostedPost) {
      const originalPost = await Post.findById(post.repostedPost);
      if (originalPost) {
        originalPost.retweets = originalPost.retweets.filter(id => id.toString() !== req.userId);
        await originalPost.save();
      }
    }

    // Энэ постоор үүсгэгдсэн reposts-ыг устгах
    await Post.deleteMany({ repostedPost: post._id });

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Пост устгасан' });
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Comment устгах (зөвхөн коментын зохиогч)
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

    // Зөвхөн коментын зохиогч устгаж болно
    if (comment.user.toString() !== req.userId) {
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