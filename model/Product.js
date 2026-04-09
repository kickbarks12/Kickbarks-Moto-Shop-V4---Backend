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

const ProductSchema = new mongoose.Schema(
  {
    name: String,

    price: {
      type: Map,
      of: Number,
      default: {}
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
        type: Map,
        of: Number,
        default: {}
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
      type: Map,
      of: Number,
      default: {}
    },

    category: {
      type: String,
      default: "general"
    },

    reviews: [ReviewSchema]
  },
  {
    toJSON: { flattenMaps: true },
    toObject: { flattenMaps: true }
  }
);

module.exports = mongoose.model("Product", ProductSchema);