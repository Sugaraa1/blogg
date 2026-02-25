const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// 🆕 Хэрэглэгч report хийх
router.post('/user/:userId', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    const reporterId = req.userId;
    const reportedUserId = req.params.userId;

    // Өөрийгөө report хийж болохгүй
    if (reporterId === reportedUserId) {
      return res.status(400).json({ message: 'Өөрийгөө report хийж болохгүй' });
    }

    // Хэрэглэгч оршин байгаа эсэхийг шалгах
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    // Аль хэдийн report хийсэн эсэхийг шалгах
    const existingReport = await Report.findOne({
      reporter: reporterId,
      reportedUser: reportedUserId
    });

    if (existingReport) {
      return res.status(400).json({ message: 'Та энэ хэрэглэгчийг аль хэдийн report хийсэн байна' });
    }

    // Report үүсгэх
    const report = new Report({
      reporter: reporterId,
      reportedUser: reportedUserId,
      reason,
      description
    });

    await report.save();

    // Report count нэмэгдүүлэх
    reportedUser.reportCount = (reportedUser.reportCount || 0) + 1;
    
    // 3+ report авсан бол 7 хоног бан
    if (reportedUser.reportCount >= 3 && !reportedUser.isBanned) {
      const banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + 7); // 7 хоног
      
      reportedUser.isBanned = true;
      reportedUser.banReason = 'Олон report авсан тул автоматаар бан авсан';
      reportedUser.bannedUntil = banUntil;
    }

    await reportedUser.save();

    res.json({ 
      message: 'Report амжилттай илгээгдлээ',
      report,
      userBanned: reportedUser.isBanned
    });
  } catch (error) {
    console.error('Report илгээхэд алдаа:', error);
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// 🆕 Пост report хийх
router.post('/post/:postId', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    const reporterId = req.userId;
    const reportedPostId = req.params.postId;

    // Пост оршин байгаа эсэхийг шалгах
    const post = await Post.findById(reportedPostId);
    if (!post) {
      return res.status(404).json({ message: 'Пост олдсонгүй' });
    }

    // Аль хэдийн report хийсэн эсэхийг шалгах
    const existingReport = await Report.findOne({
      reporter: reporterId,
      reportedPost: reportedPostId
    });

    if (existingReport) {
      return res.status(400).json({ message: 'Та энэ постыг аль хэдийн report хийсэн байна' });
    }

    // Report үүсгэх
    const report = new Report({
      reporter: reporterId,
      reportedPost: reportedPostId,
      reportedUser: post.author, // Постын эзэнд ч report тооцогдоно
      reason,
      description
    });

    await report.save();

    // Постын эзний report count нэмэгдүүлэх
    const postAuthor = await User.findById(post.author);
    if (postAuthor) {
      postAuthor.reportCount = (postAuthor.reportCount || 0) + 1;
      
      // 3+ report авсан бол 7 хоног бан
      if (postAuthor.reportCount >= 3 && !postAuthor.isBanned) {
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + 7);
        
        postAuthor.isBanned = true;
        postAuthor.banReason = 'Олон report авсан тул автоматаар бан авсан';
        postAuthor.bannedUntil = banUntil;
      }

      await postAuthor.save();
    }

    res.json({ 
      message: 'Report амжилттай илгээгдлээ',
      report
    });
  } catch (error) {
    console.error('Report илгээхэд алдаа:', error);
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Миний илгээсэн reports
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.userId })
      .populate('reportedUser', 'username displayName avatar')
      .populate('reportedPost', 'content')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(reports);
  } catch (error) {
    console.error('Reports авахад алдаа:', error);
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

module.exports = router;