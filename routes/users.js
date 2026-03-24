const express = require("express");
const mongoose = require("mongoose");
const User = require("../model/User");
const UserVoucher = require("../model/UserVoucher");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "kickbarks/avatars",
    allowed_formats: ["jpg", "png", "jpeg", "webp"]
  }
});

const upload = multer({ storage });

router.post("/avatar", upload.single("avatar"), async (req, res) => {

  try {

    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const avatarUrl = req.file.path;

    const user = await User.findByIdAndUpdate(
      req.session.userId,
      { avatar: avatarUrl },
      { new: true }
    );

    res.json({
      success: true,
      avatar: avatarUrl
    });

  } catch (err) {

    console.error("Avatar upload error:", err);
    res.status(500).json({ error: "Upload failed" });

  }

});
router.get("/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.session.userId)
      .select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});
// SAVE CART (on logout or checkout)
router.post("/cart", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { cart } = req.body;

  if (!Array.isArray(cart)) {
    return res.status(400).json({ error: "Invalid cart data" });
  }

  const user = await User.findById(req.session.userId);
  user.cart = cart;
  await user.save();

  res.json({ success: true });
});

// LOAD CART (on login)
router.get("/cart", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await User.findById(req.session.userId);
  res.json(user.cart || []);
});

// ADD / REMOVE WISHLIST
router.post("/wishlist/:productId", async (req, res) => {
  if (!req.session.userId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized"
  });
}

if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
  return res.status(400).json({
    error: "Invalid product ID"
  });
}

  const user = await User.findById(req.session.userId);
  const productId = req.params.productId;

  const index = user.wishlist.indexOf(productId);

  if (index === -1) {
    user.wishlist.push(productId);
  } else {
    user.wishlist.splice(index, 1);
  }

  await user.save();
  res.json(user.wishlist);
});

// GET WISHLIST
router.get("/wishlist", async (req, res) => {
  if (!req.session.userId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized"
  });
}


  const user = await User.findById(req.session.userId)
    .populate("wishlist");

  res.json(user.wishlist);
});

// GET WISHLIST IDS ONLY
router.get("/wishlist-ids", async (req, res) => {
  if (!req.session.userId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized"
  });
}


  const user = await User.findById(req.session.userId);
  res.json(user.wishlist.map(id => id.toString()));
});
// GET USER VOUCHERS
router.get("/vouchers", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const vouchers = await UserVoucher.find({
    userId: req.session.userId,
    used: false
  });

  res.json(vouchers);
});

module.exports = router;
