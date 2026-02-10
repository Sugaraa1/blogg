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
      return res.status(400).json({ message: 'Хэрэглэгч аль хэдийн бүртгэлтэй' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      displayName
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        following: user.following || [], // 🆕 НЭМСЭН
        followers: user.followers || []  // 🆕 НЭМСЭН
      }
    });
  } catch (error) {
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
        following: user.following || [], // 🆕 НЭМСЭН
        followers: user.followers || []  // 🆕 НЭМСЭН
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

module.exports = router;