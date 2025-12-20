const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send verification email
exports.sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "SmartProp AI - Email Verification",
    html: `<p>Please verify your email by clicking <a href="${verifyUrl}">here</a>.</p>`,
  };
  await transporter.sendMail(mailOptions);
};

// Send password reset email
exports.sendResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "SmartProp AI - Password Reset",
    html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to set a new password. This link will expire in one hour.</p>`,
  };
  await transporter.sendMail(mailOptions);
};
