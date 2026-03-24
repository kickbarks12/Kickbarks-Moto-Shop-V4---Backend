const express = require("express");
const router = express.Router();
const { sendMail } = require("../config/mailer");

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    console.log("📩 CONTACT ROUTE HIT:", req.body);

    if (!name || !email || !message) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const mailOptions = {
  to: process.env.EMAIL_USER,
  subject: "New Contact Message - Kickbarks Moto Shop",
  reply_to: email,
  html: `
    <h2>New Customer Message</h2>
    <p><b>Name:</b> ${name}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Message:</b></p>
    <p>${message}</p>
  `
};

    await sendMail(mailOptions);

    console.log("📩 Contact email sent successfully");

    res.json({ success: true });

  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;