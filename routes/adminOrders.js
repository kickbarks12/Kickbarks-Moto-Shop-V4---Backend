// const express = require("express");
// const Order = require("../model/Order");
// const adminAuth = require("../middleware/adminAuth");

// const router = express.Router();


// // =============================
// // GET ALL ORDERS
// // =============================
// router.get("/", adminAuth, async (req, res) => {
//   try {
//     const orders = await Order.find().sort({ date: -1 });
//     res.json(orders);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch orders" });
//   }
// });


// // =============================
// // UPDATE ORDER STATUS 🔥 FIXED
// // =============================
// router.patch("/:id/status", adminAuth, async (req, res) => {
//   try {
//     const { status } = req.body;

//     const allowedStatus = [
//       "Pending",
//       "Preparing",
//       "Ship out",
//       "Out for delivery",
//       "Delivered",
//       "Cancelled"
//     ];

//     if (!allowedStatus.includes(status)) {
//       return res.status(400).json({ error: "Invalid status" });
//     }

//     const order = await Order.findByIdAndUpdate(
//       req.params.id,
//       { status },
//       { new: true }
//     );

//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     res.json({ success: true, order });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Status update failed" });
//   }
// });


// // =============================
// // EXPORT CSV
// // =============================
// router.get("/export/csv", adminAuth, async (req, res) => {
//   try {
//     const orders = await Order.find();

//     const csv = [
//       "Order Number,Total,Status,Date",
//       ...orders.map(o =>
//         `${o.orderNumber},${o.total},${o.status},${o.date.toISOString()}`
//       )
//     ].join("\n");

//     res.header("Content-Type", "text/csv");
//     res.attachment("orders.csv");
//     res.send(csv);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "CSV export failed" });
//   }
// });
// router.get("/:id", async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);

//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     res.json(order);
//   } catch (err) {
//     console.error("ADMIN GET SINGLE ORDER ERROR:", err);
//     res.status(500).json({ error: "Failed to load order" });
//   }
// });
// module.exports = router;
const express = require("express");
const Order = require("../model/Order");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// =============================
// GET ALL ORDERS
// =============================
router.get("/", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// =============================
// EXPORT CSV
// =============================
router.get("/export/csv", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find();

    const csv = [
  "Order Number,Customer Name,Email,Phone,Address,Items,Total,Status,Payment,Date",
  ...orders.map(o => {
    const items = (o.items || [])
      .map(i => `${i.name} x${i.qty}${i.bike ? ` (${i.bike})` : ""}`)
      .join(" | ");

    return [
      `"${o.orderNumber}"`,
      `"${o.customerName || ""}"`,
      `"${o.customerEmail || ""}"`,
      `"${o.customerPhone || ""}"`,
      `"${o.customerAddress || ""}"`,
      `"${items}"`,
      o.total || 0,
      `"${o.status}"`,
      `"${o.paymentMethod || "COD"}"`,
      `"${new Date(o.date).toISOString()}"`
    ].join(",");
  })
].join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment("orders.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "CSV export failed" });
  }
});

// =============================
// GET SINGLE ORDER
// =============================
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("ADMIN GET SINGLE ORDER ERROR:", err);
    res.status(500).json({ error: "Failed to load order" });
  }
});

// =============================
// UPDATE ORDER STATUS
// =============================
router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatus = [
      "Pending",
      "Preparing",
      "Ship out",
      "Out for delivery",
      "Delivered",
      "Cancelled"
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Status update failed" });
  }
});

module.exports = router;