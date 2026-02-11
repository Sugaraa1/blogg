const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const { sendVerificationEmail, generateVerificationCode } = require('../utils/emailService');

// 🆕 Бүртгүүлэх - verification code илгээх
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // И-мэйл давхардсан эсэхийг шалгах
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
    
    // Verification code үүсгэх
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    const user = new User({
      username,
      email,
      password: hashedPassword,
      displayName,
      emailVerified: false,
      verificationCode,
      verificationCodeExpires
    });

    await user.save();

    // И-мэйл илгээх
    const emailSent = await sendVerificationEmail(email, verificationCode, displayName);
    
    if (!emailSent) {
      console.error('И-мэйл илгээж чадсангүй, гэхдээ хэрэглэгч үүссэн');
    }

    res.status(201).json({
      message: 'Бүртгэл амжилттай! И-мэйл хаягаа шалгаад баталгаажуулна уу.',
      email: email,
      userId: user._id
    });
  } catch (error) {
    console.error('Бүртгэл үүсгэхэд алдаа:', error);
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// 🆕 И-мэйл баталгаажуулах
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'И-мэйл аль хэдийн баталгаажсан байна' });
    }

    // Code хугацаа дууссан эсэхийг шалгах
    if (new Date() > user.verificationCodeExpires) {
      return res.status(400).json({ message: 'Баталгаажуулах код хугацаа дууссан байна' });
    }

    // Code зөв эсэхийг шалгах
    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Баталгаажуулах код буруу байна' });
    }

    // И-мэйл баталгаажуулах
    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Token үүсгэх
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
    console.error('Баталгаажуулалтын алдаа:', error);
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// 🆕 Verification code дахин илгээх
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'И-мэйл аль хэдийн баталгаажсан байна' });
    }

    // Шинэ код үүсгэх
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // И-мэйл илгээх
    const emailSent = await sendVerificationEmail(email, verificationCode, user.displayName);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'И-мэйл илгээхэд алдаа гарлаа' });
    }

    res.json({ message: 'Баталгаажуулах код дахин илгээгдлээ' });
  } catch (error) {
    console.error('Code дахин илгээхэд алдаа:', error);
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
});

// Нэвтрэх (өөрчлөлтгүй - и-мэйл баталгаажсан эсэхийг шалгахгүй)
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

    // 🆕 И-мэйл баталгаажаагүй бол анхааруулга өгөх (гэхдээ нэвтрүүлнэ)
    if (!user.emailVerified) {
      return res.status(403).json({ 
        message: 'И-мэйл хаягаа баталгаажуулна уу',
        emailNotVerified: true,
        email: user.email
      });
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

module.exports = router;