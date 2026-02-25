const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',           // Спам
      'harassment',     // Дарамт, дээрэлхэлт
      'hate_speech',    // Үзэн ядалтын үг
      'violence',       // Хүчирхийлэл
      'inappropriate',  // Зүй бус контент
      'fake_info',      // Худал мэдээлэл
      'other'          // Бусад
    ]
  },
  description: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Нэг хэрэглэгч нэг зүйлийг зөвхөн 1 удаа report хийж болно
reportSchema.index({ reporter: 1, reportedUser: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { reportedUser: { $exists: true } }
});

reportSchema.index({ reporter: 1, reportedPost: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { reportedPost: { $exists: true } }
});

module.exports = mongoose.model('Report', reportSchema);