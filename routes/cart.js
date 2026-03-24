const express = require("express");
const Cart = require("../model/Cart");
const router = express.Router();

/* ======================
   GET MY CART
====================== */
router.get("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json([]);
    }

    const cart = await Cart.findOne({ userId: req.session.userId });

    res.json(cart?.items || []);
  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.json([]);
  }
});


/* ======================
   SAVE CART
====================== */
router.post("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const items = req.body.items || [];

    const cart = await Cart.findOneAndUpdate(
      { userId: req.session.userId },
      { items: items },
      { upsert: true, new: true }
    );

    res.json(cart.items || []);
  } catch (err) {
    console.error("SAVE CART ERROR:", err);
    res.status(500).json({ error: "Failed to save cart" });
  }
});


/* ======================
   CLEAR CART (AFTER ORDER)
====================== */
router.delete("/", async (req, res) => {
  if (!req.session.userId) return res.end();

  await Cart.findOneAndDelete({ userId: req.session.userId });
  res.json({ success: true });
});

module.exports = router;
