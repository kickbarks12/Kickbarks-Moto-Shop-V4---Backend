const express = require("express");
const Voucher = require("../model/Voucher");
const UserVoucher = require("../model/UserVoucher");
const User = require("../model/User");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

/* ======================
   USER: GET MY VOUCHERS
====================== */
router.get("/my", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const vouchers = await UserVoucher.find({
    userId: req.session.userId,
    used: false
  }).sort({ createdAt: -1 });

  res.json(vouchers);
});

/* ======================
   USER: APPLY VOUCHER
====================== */
router.post("/apply", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({
        valid: false,
        message: "Please login to use a voucher"
      });
    }

    const { code, subtotal } = req.body;

    const voucher = await UserVoucher.findOne({
      userId: req.session.userId,
      code: code.toUpperCase(),
      used: false
    });

    if (!voucher) {
      return res.json({
        valid: false,
        message: "Voucher not available"
      });
    }

    if (voucher.minSpend && subtotal < voucher.minSpend) {
      return res.json({
        valid: false,
        message: `Minimum spend ₱${voucher.minSpend}`
      });
    }

    const discount = Math.min(voucher.amount, subtotal);

    res.json({
      valid: true,
      code: voucher.code,
      discount,
      finalTotal: subtotal - discount
    });

  } catch (err) {
    console.error("VOUCHER APPLY ERROR:", err);
    res.status(500).json({
      valid: false,
      message: "Failed to apply voucher"
    });
  }
});

/* ======================
   ADMIN: CREATE VOUCHER
====================== */
router.post("/admin", adminAuth, async (req, res) => {
  try {
    const { code, amount, minSpend } = req.body;

if (!code || !amount) {
  return res.status(400).json({ error: "Code and amount are required" });
}

const voucher = await Voucher.create({
  code: code.toUpperCase(),
  amount: Number(amount),
  minSpend: minSpend ? Number(minSpend) : 0,
  active: true
});


    res.json(voucher);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create voucher" });
  }
});
/* ======================
   ADMIN: GET ALL VOUCHERS
====================== */
router.get("/admin", adminAuth, async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (err) {
    console.error("GET VOUCHERS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch vouchers" });
  }
});

/* ======================
   ADMIN: ASSIGN TO ALL USERS
====================== */
router.post("/admin/assign/:voucherId", adminAuth, async (req, res) => {
  const voucher = await Voucher.findById(req.params.voucherId);
  if (!voucher) return res.status(404).json({ error: "Voucher not found" });

  const users = await User.find();

  const inserts = users.map(u => ({
    userId: u._id,
    code: voucher.code,
    amount: voucher.amount,
    minSpend: voucher.minSpend
  }));

  await UserVoucher.insertMany(inserts);

  res.json({
    success: true,
    assigned: inserts.length
  });
});
/* ======================
   ADMIN: ASSIGN TO ONE USER
====================== */
router.post("/admin/assign-user", adminAuth, async (req, res) => {
  try {
    const { userId, voucherId } = req.body;

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ error: "Voucher not found" });
    }

    // prevent duplicate voucher for same user
    const exists = await UserVoucher.findOne({
      userId,
      code: voucher.code
    });

    if (exists) {
      return res.status(400).json({ error: "Voucher already assigned to user" });
    }

    const userVoucher = await UserVoucher.create({
      userId,
      code: voucher.code,
      amount: voucher.amount,
      minSpend: voucher.minSpend
    });

    res.json({ success: true, userVoucher });

  } catch (err) {
    console.error("ASSIGN USER VOUCHER ERROR:", err);
    res.status(500).json({ error: "Failed to assign voucher" });
  }
});
/* ======================
   ADMIN: DELETE VOUCHER
====================== */
router.delete("/admin/:id", adminAuth, async (req, res) => {
  try {
    const deleted = await Voucher.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Voucher not found" });
    }

    res.json({ success: true, message: "Voucher deleted" });

  } catch (err) {
    console.error("DELETE VOUCHER ERROR:", err);
    res.status(500).json({ error: "Server error deleting voucher" });
  }
});

module.exports = router;
