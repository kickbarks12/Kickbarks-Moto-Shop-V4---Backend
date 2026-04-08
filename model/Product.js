const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  userName: String,
  rating: Number,
  comment: String,
  date: {
    type: Date,
    default: Date.now
  }
});

const ProductSchema = new mongoose.Schema({
  name: String,

  price: {
    mio: { type: Number, default: 0 },
    aerox: { type: Number, default: 0 },
    click: { type: Number, default: 0 },
    adv: { type: Number, default: 0 }
  },

  flashSale: {
    active: {
      type: Boolean,
      default: false
    },

    discountAmount: {
      type: Number,
      default: 0
    },

    salePrice: {
      mio: { type: Number, default: 0 },
      aerox: { type: Number, default: 0 },
      click: { type: Number, default: 0 },
      adv: { type: Number, default: 0 }
    },

    startsAt: {
      type: Date,
      default: null
    },

    endsAt: {
      type: Date,
      default: null
    }
  },

  images: [String],
  description: String,

  stock: {
    mio: { type: Number, default: 0 },
    aerox: { type: Number, default: 0 },
    click: { type: Number, default: 0 },
    adv: { type: Number, default: 0 }
  },

  category: {
    type: String,
    default: "general"
  },

  reviews: [ReviewSchema]
});

module.exports = mongoose.model("Product", ProductSchema);