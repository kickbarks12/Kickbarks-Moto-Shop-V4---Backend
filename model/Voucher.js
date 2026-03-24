const mongoose = require("mongoose");

const VoucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },

  amount: {
    type: Number,
    required: true
  },

  minSpend: {
    type: Number,
    default: 0
  },

  // 🔑 USER-SPECIFIC VOUCHER
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null // null = global voucher
  },

  active: {
    type: Boolean,
    default: true
  },

  used: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Voucher", VoucherSchema);
