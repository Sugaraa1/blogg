const https = require('https');

const sendVerificationEmail = async (email, code, displayName) => {
  const body = JSON.stringify({
    from: 'Э-Блог <onboarding@resend.dev>',
    to: [email],
    subject: '🐦 Э-Блог - И-мэйл баталгаажуулалт',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #1d9bf0; text-align: center;">🐦 Э-Блог</h1>
          <h2 style="color: #333; text-align: center;">Тавтай морил, ${displayName}!</h2>
          <p style="font-size: 16px; color: #555; text-align: center;">
            И-мэйл хаягаа баталгаажуулахын тулд доорх кодыг ашиглана уу:
          </p>
          <div style="background-color: #e8f5fd; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <h1 style="color: #1d9bf0; font-size: 36px; letter-spacing: 8px; font-family: monospace; margin: 0;">
              ${code}
            </h1>
          </div>
          <p style="font-size: 14px; color: #888; text-align: center;">
            Энэхүү код <strong>10 минутын</strong> хугацаатай.
          </p>
        </div>
      </div>
    `
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('Email илгээгдлээ:', email);
          resolve(true);
        } else {
          console.error('Resend алдаа:', res.statusCode, data);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Network алдаа:', err.message);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendVerificationEmail, generateVerificationCode };