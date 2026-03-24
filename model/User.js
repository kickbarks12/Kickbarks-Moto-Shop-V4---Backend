  const mongoose = require("mongoose");

  // /* Address sub-schema */
  // const AddressSchema = new mongoose.Schema({
  //   label: String,        // Home, Office, etc
  //   street: String,
  //   city: String,
  //   province: String,
  //   zip: String
  // }, { _id: false });

  const UserSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },
avatar: String, // ⭐ Google profile picture
avatarSource: {
  type: String,
  enum: ["google", "upload"],
  default: "google"
},
    mobile: {
      type: String,
      default: ""
    },

    birthday: {
      type: Date
    },

  //   addresses: {
  //   type: [AddressSchema],
  //   default: []
  // },
    // vouchers: {
    //   type: Number,
    //   default: 0
    // },
      // ✅ ADD THIS (Forgot Password Support)
  resetPasswordToken: String,
  resetPasswordExpires: Date,

    wishlist: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" }
    ],
  cart: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      },
      name: String,
      price: Number,
      qty: Number,
      image: String
    }
  ]

  }, { timestamps: true });

  module.exports = mongoose.model("User", UserSchema);
