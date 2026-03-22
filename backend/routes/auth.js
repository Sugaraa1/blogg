const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

// Бүртгүүлэх
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Энэ и-мэйл хаяг аль хэдийн бүртгэлтэй байна' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Энэ хэрэглэгчийн нэр аль хэдийн бүртгэлтэй байна' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      displayName,
      emailVerified: true,
      verificationCode: null,
      verificationCodeExpires: null
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      message: 'Бүртгэл амжилттай!',
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        following: user.following || [],
        followers: user.followers || []
      }
    });
  } catch (error) {
    console.error('Бүртгэл үүсгэхэд алдаа:', error);
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Нэвтрэх
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'И-мэйл эсвэл нууц үг буруу' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'И-мэйл эсвэл нууц үг буруу' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        following: user.following || [],
        followers: user.followers || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// И-мэйл баталгаажуулах (идэвхгүй - шууд амжилттай буцаана)
router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      message: 'И-мэйл амжилттай баталгаажлаа!',
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        following: user.following || [],
        followers: user.followers || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Verification code дахин илгээх (идэвхгүй)
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }
    res.json({ message: 'Баталгаажуулах код илгээгдлээ' });
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

module.exports = router;