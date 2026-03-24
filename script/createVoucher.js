require("dotenv").config();
const mongoose = require("mongoose");
const Voucher = require("../models/Voucher");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await Voucher.create([
      {
        code: "SAVE100",
        amount: 100,
        minSpend: 500,
        active: true
      },
      {
        code: "KICK200",
        amount: 200,
        minSpend: 1000,
        active: true
      }
    ]);

    console.log("✅ Test vouchers created");
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
