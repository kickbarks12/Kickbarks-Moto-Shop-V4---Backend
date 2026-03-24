const express = require("express");
const Order = require("../model/Order");
const Product = require("../model/Product");
const Voucher = require("../model/Voucher");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", adminAuth, async (req, res) => {
  try {
    const range = req.query.range || "week";
    const days = range === "month" ? 30 : 7;

    const orders = await Order.find();
// ===== TODAY DATE RANGE =====
const startOfDay = new Date();
startOfDay.setHours(0,0,0,0);

const endOfDay = new Date();
endOfDay.setHours(23,59,59,999);

// ===== TODAY ORDERS =====
const todayOrders = orders.filter(o => {
  const d = new Date(o.date);   // 🔥 use order date field
  return d >= startOfDay && d <= endOfDay;
});


// ===== TODAY SALES =====
const todaySales = todayOrders.reduce((sum,o)=> sum + (o.total || 0),0);

// ===== ORDERS TODAY COUNT =====
const ordersToday = todayOrders.length;

// ===== PRODUCTS SOLD TOTAL =====
let productsSold = 0;
orders.forEach(o=>{
  (o.items || []).forEach(i=>{
    productsSold += Number(i.qty || 0);
  });
});

    // ======================
    // KPIs
    // ======================
    const totalOrders = orders.length;

   const completedOrdersList = orders.filter(
  o => o.status === "Completed" || o.status === "Delivered"
);

    const totalSales = completedOrdersList.reduce(
      (sum, o) => sum + o.total,
      0
    );

    const pendingOrders = orders.filter(
      o => o.status === "Pending"
    ).length;

    const completedOrders = completedOrdersList.length;

    const totalProducts = await Product.countDocuments();
    const activeVouchers = await Voucher.countDocuments({ active: true });

    // ======================
    // RECENT ORDERS
    // ======================
    const recentOrders = await Order.find()
      .sort({ date: -1 })
      .limit(5);

    // ======================
    // SALES BY DAY
    // ======================
    const salesByDay = await Order.aggregate([
      {
        $match: {
  status: { $in: ["Completed", "Delivered"] },

          date: {
            $gte: new Date(
              Date.now() - days * 24 * 60 * 60 * 1000
            )
          }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$date" },
            month: { $month: "$date" }
          },
          total: { $sum: "$total" }
        }
      },
      { $sort: { "_id.month": 1, "_id.day": 1 } }
    ]);

    // ======================
    // TOP PRODUCTS
    // ======================
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          sold: { $sum: "$items.qty" }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalSales,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalProducts,
      activeVouchers,
      recentOrders,
      salesByDay,
      topProducts,
      todaySales,
ordersToday,
productsSold,

    });
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    res.status(500).json({ error: "Dashboard failed" });
  }
});

module.exports = router;
