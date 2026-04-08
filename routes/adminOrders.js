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
    const orders = await Order.find().sort({ date: -1 });

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '""';
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const header = [
      "Order Number",
      "Customer Name",
      "Email",
      "Phone",
      "Address",
      "Items",
      "Subtotal",
      "Shipping",
      "Discount",
      "Voucher",
      "Total",
      "Payment Method",
      "Status",
      "Refund Status",
      "Refund Reason",
      "Refund Amount",
      "Order Date"
    ];

    const rows = orders.map((o) => {
      const items = (o.items || [])
        .map((i) => {
          const qty = i.qty || 0;
          const price = i.price || 0;
          const itemTotal = qty * price;

          return [
            i.name || "Unnamed Item",
            `Qty: ${qty}`,
            `Price: ₱${price.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`,
            i.bike ? `Bike: ${i.bike}` : null,
            `Item Total: ₱${itemTotal.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`
          ]
            .filter(Boolean)
            .join(" | ");
        })
        .join(" || ");

      return [
        escapeCSV(o.orderNumber || ""),
        escapeCSV(o.customerName || ""),
        escapeCSV(o.customerEmail || ""),
        escapeCSV(o.customerPhone || ""),
        escapeCSV(o.customerAddress || ""),
        escapeCSV(items),
        escapeCSV((o.subtotal || 0).toFixed(2)),
        escapeCSV((o.shipping || 0).toFixed(2)),
        escapeCSV((o.discount || 0).toFixed(2)),
        escapeCSV(o.voucher || ""),
        escapeCSV((o.total || 0).toFixed(2)),
        escapeCSV(o.paymentMethod || "COD"),
        escapeCSV(o.status || "Pending"),
        escapeCSV(o.refundStatus || "None"),
        escapeCSV(o.refundReason || ""),
        escapeCSV(o.refundAmount || 0),
        escapeCSV(
          o.date
            ? new Date(o.date).toLocaleString("en-PH", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
              })
            : ""
        )
      ].join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header("Content-Disposition", 'attachment; filename="orders.csv"');
    res.write("\uFEFF");
    res.send(csv);
  } catch (err) {
    console.error("CSV export failed:", err);
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