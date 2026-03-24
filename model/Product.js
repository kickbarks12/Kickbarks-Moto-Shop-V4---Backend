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

  images: [String],
  description: String,
  // 🆕 STOCK
 stock: {
  mio: { type: Number, default: 0 },
  aerox: { type: Number, default: 0 },
  click: { type: Number, default: 0 },
  adv: { type: Number, default: 0 }
},

    // 🆕 ADD CATEGORY
  category: {
    type: String,
    default: "general"
  },
  reviews: [ReviewSchema]
});

module.exports = mongoose.model("Product", ProductSchema);
