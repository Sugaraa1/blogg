const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    // Ban-ийн хугацаа дууссан эсэхийг шалгах
    if (user.isBanned && user.bannedUntil) {
      const now = new Date();
      if (now > user.bannedUntil) {
        // Ban-ийн хугацаа дууссан - цэвэрлэх
        user.isBanned = false;
        user.banReason = null;
        user.bannedUntil = null;
        await user.save();
      } else {
        // Одоо бан байгаа
        const daysLeft = Math.ceil((user.bannedUntil - now) / (1000 * 60 * 60 * 24));
        return res.status(403).json({ 
          message: `Таны бүртгэл ${daysLeft} хоног бан авсан байна. Шалтгаан: ${user.banReason}`,
          isBanned: true,
          bannedUntil: user.bannedUntil,
          banReason: user.banReason
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Серверийн алдаа', error: error.message });
  }
};