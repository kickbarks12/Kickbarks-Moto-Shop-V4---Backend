const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("./model/admin");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

(async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error("❌ ADMIN_EMAIL or ADMIN_PASSWORD missing in .env");
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, 10);

    await Admin.updateOne(
      { email },
      { $set: { password: hash } },
      { upsert: true }
    );

    console.log("✅ Admin password hashed and saved");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();