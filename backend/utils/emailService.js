const nodemailer = require('nodemailer');
const dns = require('dns');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  },
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, family: 4 }, callback);
  }
});

const sendVerificationEmail = async (email, code, displayName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🐦 Э-Блог - И-мэйл баталгаажуулалт',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #1d9bf0; text-align: center;">🐦 Э-Блог</h1>
          <h2 style="color: #333; text-align: center;">Тавтай морил, ${displayName}!</h2>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Та Э-Блог системд амжилттай бүртгүүллээ. И-мэйл хаягаа баталгаажуулахын тулд 
            доорх кодыг ашиглана уу:
          </p>
          <div style="background-color: #e8f5fd; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <h1 style="color: #1d9bf0; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${code}
            </h1>
          </div>
          <p style="font-size: 14px; color: #888; text-align: center;">
            Энэхүү код <strong>10 минутын</strong> хугацаатай.
          </p>
          <p style="font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Хэрэв та энэ бүртгэлийг үүсгээгүй бол энэ и-мэйлийг үл тоомсорлоно уу.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email илгээгдлээ:', email);
    return true;
  } catch (error) {
    console.error('И-мэйл илгээхэд алдаа:', error);
    return false;
  }
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  sendVerificationEmail,
  generateVerificationCode
};