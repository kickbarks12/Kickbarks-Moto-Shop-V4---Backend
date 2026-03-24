const express = require("express");
const User = require("../model/User");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// ======================
// ADMIN: GET ALL USERS
// ======================
router.get("/", adminAuth, async (req, res) => {
  try {
    const users = await User.find(
      {},
      { password: 0 } // exclude password
    ).sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("ADMIN USERS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
