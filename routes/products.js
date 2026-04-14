const FLASH_DURATION = 1 * 60 * 60 * 1000; // 2 hours
const express = require("express");
const Product = require("../model/Product");
const adminAuth = require("../middleware/adminAuth");
const upload = require("../utils/productUpload");
const router = express.Router();

function getTierDiscount(price) {
  const amount = Number(price || 0);

  if (amount <= 500) return Math.round(amount * 0.03);
  if (amount <= 1000) return Math.round(amount * 0.05);
  return Math.round(amount * 0.08);
}
async function updateFlashSaleIfNeeded() {
  const now = new Date();

  // Check if there is any active flash sale still valid
  const active = await Product.findOne({
    "flashSale.active": true,
    "flashSale.endsAt": { $gt: now }
  });

  if (active) return; // still valid, do nothing

  // 🔥 RESET ALL PRODUCTS
  await Product.updateMany({}, {
    $set: {
      "flashSale.active": false,
      "flashSale.discountAmount": 0,
      "flashSale.salePrice": {},
      "flashSale.startsAt": null,
      "flashSale.endsAt": null
    }
  });

  // 🔥 PICK RANDOM PRODUCTS
  const products = await Product.aggregate([{ $sample: { size: 3 } }]);

  const startsAt = now;
  const endsAt = new Date(now.getTime() + FLASH_DURATION);

  for (const p of products) {
  const priceObj = p.price || {};
const salePrice = {};
let discountAmount = 0;

Object.entries(priceObj).forEach(([key, value]) => {
  const original = Number(value || 0);

  if (original <= 0) {
    salePrice[key] = 0;
    return;
  }

  const discount = getTierDiscount(original);
  salePrice[key] = Math.max(original - discount, 1);

  if (discount > discountAmount) {
    discountAmount = discount;
  }
});

await Product.findByIdAndUpdate(p._id, {
  $set: {
    "flashSale.active": true,
    "flashSale.discountAmount": discountAmount,
    "flashSale.salePrice": salePrice,
    "flashSale.startsAt": startsAt,
    "flashSale.endsAt": endsAt
  }
});
  }
}
// GET ALL PRODUCTS
router.get("/", async (req, res) => {
  try {
    await updateFlashSaleIfNeeded();

    const products = await Product.find().limit(50);

    const result = products.map(p => {
      const reviews = p.reviews || [];
      const count = reviews.length;
      const avg =
        count === 0
          ? 0
          : reviews.reduce((s, r) => s + r.rating, 0) / count;

      return {
        ...p.toObject({ flattenMaps: true }),
        ratingAvg: avg,
        ratingCount: count
      };
    });

    res.json(result);

  } catch (err) {
    console.error("FETCH PRODUCTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});


// GET SINGLE PRODUCT BY ID (THIS FIXES YOUR ERROR)
router.get("/:id", async (req, res) => {
  if (!require("mongoose").Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      error: "Invalid product ID"
    });
  }
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product.toObject({ flattenMaps: true }));
  } catch (err) {
    res.status(400).json({ error: "Invalid product ID" });
  }
});
/* =========================
   ADMIN ROUTES (PROTECTED)
========================= */

// DELETE PRODUCT
router.delete("/:id", adminAuth, async (req, res) => {
  if (!require("mongoose").Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      error: "Invalid product ID"
    });
  }
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "Failed to delete product" });
  }
});
// UPDATE PRODUCT (ADMIN)
router.post(
  "/",
  adminAuth,
  upload.array("images", 5),
  async (req, res) => {
    console.log("RAW BODY PRICE:", req.body.price);
console.log("RAW BODY STOCK:", req.body.stock);
    let price = {};
    let stock = {};

    try {
      price = JSON.parse(req.body.price || "{}");
      stock = JSON.parse(req.body.stock || "{}");
    } catch (err) {
      return res.status(400).json({ error: "Invalid price or stock format" });
    }

    const hasNegative =
      Object.values(price).some(v => Number(v) < 0) ||
      Object.values(stock).some(v => Number(v) < 0);

    if (hasNegative) {
      return res.status(400).json({
        error: "Price and stock cannot be negative"
      });
    }

    try {
      const imagePaths = req.files ? req.files.map(f => f.path) : [];

      if (!req.body.name || req.body.name.length < 3) {
        return res.status(400).json({
          error: "Product name must be at least 3 characters"
        });
      }

      const product = await Product.create({
        name: req.body.name,
        price,
        stock,
        description: req.body.description,
        category: req.body.category?.toLowerCase() || "general",
        images: imagePaths
      });

      res.json(product);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: "Failed to create product" });
    }
  }
);
/* =========================
   EDIT PRODUCT (ADMIN)
========================= */
router.put("/:id", adminAuth, upload.array("images", 5), async (req, res) => {

  let price = {};
  let stock = {};

  try {
    price = JSON.parse(req.body.price || "{}");
    stock = JSON.parse(req.body.stock || "{}");
  } catch (err) {
    return res.status(400).json({ error: "Invalid price or stock format" });
  }

  const hasNegative =
    Object.values(price).some(v => Number(v) < 0) ||
    Object.values(stock).some(v => Number(v) < 0);

  if (hasNegative) {
    return res.status(400).json({
      error: "Price and stock cannot be negative"
    });
  }

  if (!require("mongoose").Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // basic fields
    if (req.body.name) product.name = req.body.name;
    if (req.body.description) product.description = req.body.description;
    if (req.body.category) {
      product.category = req.body.category.toLowerCase();
    }

    // 🔥 IMPORTANT
    product.price = price;
    product.stock = stock;

    // images
    if (req.files && req.files.length > 0) {
      product.images = req.files.map(f => f.path);
    }

    await product.save();

    res.json({
      success: true,
      message: "Product updated",
      product
    });

  } catch (err) {
    console.error("EDIT PRODUCT ERROR:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

module.exports = router;
