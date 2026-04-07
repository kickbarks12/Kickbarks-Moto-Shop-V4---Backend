const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  

  // ======================
  // ORDER META
  // ======================
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    default: () =>
      `KB-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  date: {
    type: Date,
    default: Date.now
  },

 status: {
  type: String,
  enum: [
    "Pending",
    "Preparing",
    "Ship out",
    "Out for delivery",
    "Delivered",
    "Cancelled"
  ],
  default: "Pending"
},


  // ======================
  // CUSTOMER BILLING INFO ✅
  // ======================
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  customerAddress: String,
// ======================
// PAYMENT INFO 🔥 ADD THIS
// ======================
paymentMethod: {
  type: String,
  default: null
},

  // ======================
  // ORDER ITEMS
  // ======================
  items: [
  {
    _id: String,
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    name: String,
    price: Number,
    qty: Number,
    bike: String,
    image: {
      type: String,
      default: ""
    }
  }
],

  // ======================
  // PRICE BREAKDOWN ✅
  // ======================
  subtotal: {
    type: Number,
    default: 0
  },

  shipping: {
    type: Number,
    default: 0
  },

  discount: {
    type: Number,
    default: 0
  },

  total: {
    type: Number,
    required: true
  },

  voucher: String,

  // ======================
  // REFUNDS
  // ======================
  refundStatus: {
    type: String,
    default: "None"
  },

  refundReason: String,
  refundAmount: Number
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
