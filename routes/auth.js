const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../model/User");
const jwt = require("jsonwebtoken");
const Admin = require("../model/admin");
const crypto = require("crypto");
const { sendMail } = require("../config/mailer");
const rateLimit = require("express-rate-limit");
const generateVoucherCode = require("../utils/voucher");
const UserVoucher = require("../model/UserVoucher");
const passport = require("passport");
const router = express.Router();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loginLimiter = rateLimit({
 windowMs: 15 * 60 * 1000,
 max: 10,
 message: "Too many login attempts. Please try again later."
});

// SIGNUP
router.post("/signup", loginLimiter, async (req,res)=>{
  try {

    const { name, email, password, mobile, birthday } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters"
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // CREATE USER
    const user = await User.create({
      name,
      email,
      password: hashed,
      mobile,
      birthday
    });

    // 🎟 GENERATE WELCOME VOUCHER
    const voucherCode = generateVoucherCode();

    await UserVoucher.create({
      userId: user._id,
      code: voucherCode,
      amount: 100,
      minSpend: 500,
      used: false
    });

    req.session.userId = user._id;

    return res.json({
      success: true,
      voucher: voucherCode
    });

  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    return res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // ensure session exists
    if (!req.session) {
      return res.status(500).json({ error: "Session not initialized" });
    }

    req.session.userId = user._id;

    if (remember) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
    } else {
      req.session.cookie.expires = false;
    }

    res.json({ success: true });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/admin/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) { 
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    res.status(500).json({ error: "Admin login failed" });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});


// =====================
// FORGOT PASSWORD
// =====================
router.post("/forgot-password", loginLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always respond success (security)
    if (!user) {
      return res.json({ success: true });
    }

    // create secure token
    const token = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink =
`https://kickbarksmotoshop.onrender.com/reset-password.html?token=${token}`;

    // // EMAIL CONFIG
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS
    //   }
    // });

   await sendMail({
      to: user.email,
      subject: "Reset Your Password",
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset.</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

// =====================
// RESET PASSWORD
// =====================
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: "Token invalid or expired"
      });
    }
if (password.length < 8) {
 return res.status(400).json({
  error: "Password must be at least 8 characters"
 });
}
    // hash new password
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;

    // remove token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ success: true });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ error: "Password reset failed" });
  }
});
router.get("/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);
router.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login.html"
  }),
  (req, res) => {

    req.session.userId = req.user._id;

    res.redirect("https://kickbarksmotoshop.onrender.com/index.html");
  }
);
module.exports = router;
