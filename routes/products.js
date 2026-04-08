const FLASH_DURATION = 2 * 60 * 60 * 1000; // 2 hours
const express = require("express");
const Product = require("../model/Product");
const adminAuth = require("../middleware/adminAuth");
const upload = require("../utils/productUpload");
const Order = require("../model/Order");
const router = express.Router();

function getTierDiscount(price) {
  const amount = Number(price || 0);

  if (amount <= 500) return Math.round(amount * 0.05);
  if (amount <= 1000) return Math.round(amount * 0.07);
  return Math.round(amount * 0.10);
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
      "flashSale.salePrice": {
        mio: 0,
        aerox: 0,
        click: 0,
        adv: 0
      },
      "flashSale.startsAt": null,
      "flashSale.endsAt": null
    }
  });

  // 🔥 PICK RANDOM PRODUCTS
  const products = await Product.aggregate([{ $sample: { size: 5 } }]);

  const startsAt = now;
  const endsAt = new Date(now.getTime() + FLASH_DURATION);

  for (const p of products) {
    const salePrice = {
  mio: Math.max((p.price?.mio || 0) - getTierDiscount(p.price?.mio || 0), 1),
  aerox: Math.max((p.price?.aerox || 0) - getTierDiscount(p.price?.aerox || 0), 1),
  click: Math.max((p.price?.click || 0) - getTierDiscount(p.price?.click || 0), 1),
  adv: Math.max((p.price?.adv || 0) - getTierDiscount(p.price?.adv || 0), 1)
};

const discountAmount = Math.max(
  getTierDiscount(p.price?.mio || 0),
  getTierDiscount(p.price?.aerox || 0),
  getTierDiscount(p.price?.click || 0),
  getTierDiscount(p.price?.adv || 0)
);

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
    // await updateFlashSaleIfNeeded();

    const products = await Product.find().limit(50);

    const result = products.map(p => {
      const reviews = p.reviews || [];
      const count = reviews.length;
      const avg =
        count === 0
          ? 0
          : reviews.reduce((s, r) => s + r.rating, 0) / count;

      return {
        ...p.toObject(),
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

    res.json(product);
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
    const prices = [
  Number(req.body.price_mio),
  Number(req.body.price_aerox),
  Number(req.body.price_click),
  Number(req.body.price_adv)
];

const stocks = [
  Number(req.body.stock_mio),
  Number(req.body.stock_aerox),
  Number(req.body.stock_click),
  Number(req.body.stock_adv)
];

// validate negative values
if (prices.some(p => p < 0) || stocks.some(s => s < 0)) {
  return res.status(400).json({
    error: "Price and stock cannot be negative"
  });
}
    try {
      const imagePaths = req.files
        ? req.files.map(f => f.path)
        : [];
if (!req.body.name || req.body.name.length < 3) {
  return res.status(400).json({
    error: "Product name must be at least 3 characters"
  });
}
      const product = await Product.create({
        name: req.body.name,
        price: {
  mio: Number(req.body.price_mio) || 0,
  aerox: Number(req.body.price_aerox) || 0,
  click: Number(req.body.price_click) || 0,
  adv: Number(req.body.price_adv) || 0
},


        description: req.body.description,
        category: req.body.category?.toLowerCase() || "general",
        stock: {
  mio: Number(req.body.stock_mio) || 0,
  aerox: Number(req.body.stock_aerox) || 0,
  click: Number(req.body.stock_click) || 0,
  adv: Number(req.body.stock_adv) || 0
},
   
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
  const prices = [
  Number(req.body.price_mio),
  Number(req.body.price_aerox),
  Number(req.body.price_click),
  Number(req.body.price_adv)
];

const stocks = [
  Number(req.body.stock_mio),
  Number(req.body.stock_aerox),
  Number(req.body.stock_click),
  Number(req.body.stock_adv)
];

if (prices.some(p => p < 0) || stocks.some(s => s < 0)) {
  return res.status(400).json({
    error: "Price and stock cannot be negative"
  });
}
  if (!require("mongoose").Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      error: "Invalid product ID"
    });
  }
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // update name & description
    if (req.body.name) product.name = req.body.name;
    if (req.body.description) product.description = req.body.description;

    // update category
    if (req.body.category) {
      product.category = req.body.category.toLowerCase();
    }

    // update prices
    product.price = {
      mio: Number(req.body.price_mio) || 0,
      aerox: Number(req.body.price_aerox) || 0,
      click: Number(req.body.price_click) || 0,
      adv: Number(req.body.price_adv) || 0
    };

    // update stocks
    product.stock = {
      mio: Number(req.body.stock_mio) || 0,
      aerox: Number(req.body.stock_aerox) || 0,
      click: Number(req.body.stock_click) || 0,
      adv: Number(req.body.stock_adv) || 0
    };

    // if new images uploaded → replace
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
