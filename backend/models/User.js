const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: '',
    maxlength: 160
  },
  avatar: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // 🆕 Block list - блоклосон хэрэглэгчид
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // 🆕 Ban system
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: null
  },
  bannedUntil: {
    type: Date,
    default: null
  },
  reportCount: {
    type: Number,
    default: 0
  },
  // И-мэйл баталгаажуулалт
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);