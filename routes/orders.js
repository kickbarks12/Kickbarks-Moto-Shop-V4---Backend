const express = require("express");
const Order = require("../model/Order");
const User = require("../model/User");
const router = express.Router();
const sendReceiptEmail = require("../utils/sendReceiptEmail");
const generateReceiptPDF = require("../utils/generateReceiptPDF");
const sendRefundEmail = require("../utils/sendRefundEmail");
const UserVoucher = require("../model/UserVoucher");
const Product = require("../model/Product");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");




const orderLimiter = rateLimit({
 windowMs: 10 * 60 * 1000,
 max: 20,
 message: "Too many orders. Please try again later."
});
// storage config



router.post("/", orderLimiter, async (req,res)=>{

  
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

const { items, customer, voucher, paymentMethod } = req.body;

// 🔥 ensure voucher always clean
const cleanVoucher =
  voucher && voucher !== "null" && voucher !== "undefined"
    ? voucher.trim().toUpperCase()
    : null;
if (
  !customer ||
  !customer.name ||
  !customer.email ||
  !customer.phone ||
  !customer.address
) {
  return res.status(400).json({
    error: "Customer details are required"
  });
}
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(customer.email)) {
  return res.status(400).json({
    error: "Invalid email format"
  });
}
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items" });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    // 🚫 PREVENT DUPLICATE ORDER (5 sec protection)
const recentOrder = await Order.findOne({
  userId: req.session.userId,
  date: { $gte: new Date(Date.now() - 5000) }
});

if (recentOrder) {
  return res.status(429).json({
    error: "Order already placed. Please wait a moment."
  });
}

function normalizeBikeKey(bike) {
  return String(bike || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

    // 1️⃣ Subtotal
let subtotal = 0;

for (const item of items) {
  const qty = Number(item.qty);
  const price = Number(item.price || 0); // ✅ USE CART PRICE

  subtotal += price * qty;
}
    // 2️⃣ Voucher logic (CORRECT LOCATION)
    // 2️⃣ Voucher logic (ONE-TIME USE)
let discount = 0;
let appliedVoucher = null;

if (cleanVoucher) {
  const userVoucher = await UserVoucher.findOne({
    userId: req.session.userId,
    code: cleanVoucher,
    used: false
  });

  // ✅ VALID voucher
  if (userVoucher && subtotal >= userVoucher.minSpend) {
    discount = userVoucher.amount;
    appliedVoucher = userVoucher;

    console.log("✅ Voucher applied:", userVoucher.code);
  } 
  else {
    console.log("❌ Voucher invalid or not eligible");
  }
}

const SHIPPING_FEE = 150;


    // 3️⃣ Final total (backend truth)
    const finalTotal = Math.max(
  subtotal + SHIPPING_FEE - discount,
  0
);
if (isNaN(subtotal) || isNaN(finalTotal)) {
  console.log("INVALID ORDER DATA:", {
    items,
    subtotal,
    discount,
    SHIPPING_FEE,
    finalTotal
  });

  return res.status(400).json({
    error: "Order calculation failed"
  });
}
// 🔒 STOCK VALIDATION BEFORE ORDER CREATE
for (const item of items) {
  const product = await Product.findById(item.productId || item._id);



  if (!product) {
    return res.status(400).json({
      error: `Product not found: ${item.name}`
    });
  }

const bikeKey = normalizeBikeKey(item.bike);
const availableStock = Number(product.stock?.[bikeKey] || 0);

if (availableStock < Number(item.qty)) {
  return res.status(400).json({
    error: `${product.name} (${item.bike}) is out of stock`
  });
}

}

const orderNumber = `KB-${Date.now()}-${Math.floor(Math.random()*900+100)}`;
const processedItems = [];

for (const item of items) {
  const product = await Product.findById(item.productId || item._id);

  if (!product) continue;

  const bike = (item.bike || "").toLowerCase();

  processedItems.push({
  productId: product._id,
  name: product.name,

  // 🔥 USE CART VALUES (LOCK PRICE)
  price: Number(item.price || 0),
  originalPrice: Number(item.originalPrice || item.price || 0),
  flashSale: item.flashSale === true,
  flashSaleDiscount: Number(item.flashSaleDiscount || 0),

  qty: Number(item.qty),
  bike: item.bike,
  image: product.images?.[0] || ""
});
}
    // 4️⃣ Create order
    const order = await Order.create({
  orderNumber: orderNumber,
  userId: user._id,

  // ITEMS & PRICES
  items: processedItems,
  subtotal,
  shipping: SHIPPING_FEE,
  discount,
  total: finalTotal,

  // CUSTOMER BILLING INFO ✅
  customerName: customer.name,
  customerEmail: customer.email,
  customerPhone: customer.phone,
  customerAddress: customer.address,

  // VOUCHER
voucher: appliedVoucher ? appliedVoucher.code : null,
paymentMethod: paymentMethod || "COD" // ✅ add this

});

// 📦 AUTO DEDUCT STOCK
for (const item of items) {
  const bikeKey = normalizeBikeKey(item.bike);
  const updateField = `stock.${bikeKey}`;

  await Product.findByIdAndUpdate(
    item.productId || item._id,
    { $inc: { [updateField]: -Number(item.qty) } }
  );
}

// 🔒 Mark voucher as used AFTER order is safely created
if (appliedVoucher) {
  appliedVoucher.used = true;
  appliedVoucher.usedAt = new Date();
  await appliedVoucher.save();
}

res.json({
  success: true,
  orderId: order._id,
  finalTotal
});

// 🔥 SEND EMAILS IN BACKGROUND
setTimeout(async () => {
  try {
    console.log("STEP 1: sending customer receipt");

    await sendReceiptEmail(order, order.customerEmail);

    const { sendMail } = require("../config/mailer");

    const itemList = order.items.map(item =>
      `<li>${item.name} × ${item.qty}</li>`
    ).join("");

    console.log("STEP 2: sending admin email");

    await sendMail({
  to: process.env.EMAIL_ADMIN,
 subject: `🛒 New Order #${order.orderNumber}`,
  html: `
    <h2>🛒 New Order Received</h2>
    <p><b>Customer:</b> ${order.customerName}</p>
    <p><b>Email:</b> ${order.customerEmail}</p>
    <ul>${itemList}</ul>
    <p><b>Total:</b> ₱${order.total}</p>
  `
});

    console.log("✅ Emails sent");

  } catch (err) {
    console.error("EMAIL BACKGROUND ERROR:", err);
  }
}, 1000);




  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({
  error: "Order processing failed",
  message: err.message
});
  }
});


// GET USER ORDERS
// GET USER ORDERS (with pagination + search)
router.get("/", async (req, res) => {
  try {
    // 1️⃣ Auth check
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // 2️⃣ Read query params
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // orders per page
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // 3️⃣ Build query
    const query = {
      userId: req.session.userId
    };

    // 4️⃣ Optional search (status or order ID)
    if (search) {
      query.$or = [
        { status: { $regex: search, $options: "i" } },
        { orderNumber: { $regex: search, $options: "i" } },
        ...(search.match(/^[0-9a-fA-F]{24}$/)
          ? [{ _id: search }]
          : [])
      ];
    }

    // 5️⃣ Count total orders
    const totalOrders = await Order.countDocuments(query);

    // 6️⃣ Fetch paginated orders
    const orders = await Order.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // 7️⃣ Respond
    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit)
    });

  } catch (err) {
    console.error("FETCH ORDERS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});



// GET SINGLE ORDER
router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return res.status(400).json({
    error: "Invalid order ID"
  });
}
  if (!req.session.userId) return res.status(401).end();

  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.session.userId
  });

  if (!order) return res.status(404).end();

  res.json(order);
});



// CANCEL ORDER (Pending only)
router.patch("/:id/cancel", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return res.status(400).json({
    error: "Invalid order ID"
  });
}
  try {
    // 1️⃣ Auth check
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { id } = req.params;

    // 2️⃣ Find order
    const order = await Order.findOne({
      _id: id,
      userId: req.session.userId
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 3️⃣ Check status
    if (order.status !== "Pending") {
      return res.status(400).json({
        error: "Only pending orders can be cancelled"
      });
    }

    // 4️⃣ Update status
    order.status = "Cancelled";
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully"
    });

  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});
// REQUEST REFUND
router.patch("/:id/refund", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return res.status(400).json({
    error: "Invalid order ID"
  });
}
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Refund reason required" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.session.userId
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

   if (order.refundStatus === "Refunded" || order.refundStatus === "Requested") {
  return res.status(400).json({
    error: "Refund already requested"
  });
}


    if (order.status === "Pending") {
      return res.status(400).json({
        error: "Cancel order before requesting refund"
      });
    }

    order.refundStatus = "Requested";
    order.refundReason = reason;
    order.refundAmount = order.total;

    await order.save();

    // 📧 SEND EMAIL
    const user = await User.findById(order.userId);
    sendRefundEmail(user.email, order);

    res.json({ success: true });

  } catch (err) {
    console.error("REFUND ERROR:", err);
    res.status(500).json({ error: "Refund failed" });
  }
});


module.exports = router;






