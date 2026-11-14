const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendVerificationEmail(toEmail, userName, verificationToken) {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const confirmLink = `${baseUrl}/api/auth/verify?token=${verificationToken}`;

  const mailOptions = {
    from: `"عيادة الأسنان التخصصية" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'مرحباً بك في عيادتنا - يرجى تأكيد بريدك الإلكتروني',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 25px; background: #f1f5f9; color: #0f172a;">
        <div style="background: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e3a5f; margin-top: 0;">أهلاً بك يا ${userName} في عيادتنا</h2>
          <p style="font-size: 16px; line-height: 1.6;">يسعدنا انضمامك إلينا. لتفعيل حسابك وتأكيد بريدك الإلكتروني، يرجى الضغط على الزر أدناه:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmLink}" style="display: inline-block; background: #2563a8; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">تأكيد البريد الإلكتروني</a>
          </div>
          <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px;">إذا لم تقم بطلب هذا التسجيل، يمكنك تجاهل هذه الرسالة بأمان.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('خطأ في إرسال البريد الإلكتروني:', err.message);
  }
}

module.exports = {
  transporter,
  sendVerificationEmail
};