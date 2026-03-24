const mongoose = require("mongoose");

const UserVoucherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    code: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    minSpend: {
      type: Number,
      default: 0
    },

    used: {
      type: Boolean,
      default: false
    },

    usedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserVoucher", UserVoucherSchema);
