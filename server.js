// require("dotenv").config();

// const express = require("express");
// const mongoose = require("mongoose");
// const session = require("express-session");
// const cors = require("cors");
// const path = require("path");
// const cookieParser = require("cookie-parser");
// const fs = require("fs");



// const passport = require("passport");
// require("./config/googleAuth");


// const reviewRoutes = require("./routes/reviewRoutes");
// const rateLimit = require("express-rate-limit");

// const adminUsersRoutes = require("./routes/adminUsers");
// const contactRoute = require("./routes/contact");

// const app = express();

// app.set("trust proxy", 1);
// app.disable("x-powered-by");



// const apiLimiter = rateLimit({
//  windowMs: 15 * 60 * 1000,
//  max: 100,
//  message: "Too many requests. Please try again later."
// });

// app.use("/api", apiLimiter);

// // Middleware
// app.use(cors({
//   origin: [
//     "https://kickbarksmotoshop.onrender.com",
//     "https://kickbarks-moto-shop.onrender.com",
//     "http://localhost:4000",
//     "http://localhost:8100",
//     "capacitor://localhost",
//     "http://10.0.2.2",
//     "http://127.0.0.1:5500"
//   ],
//   credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// app.use(
//   session({
//     name: "kickbarks.sid",
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     proxy: true, // ⭐ VERY IMPORTANT ON RENDER
//     cookie: {
//   httpOnly: true,
//   secure: true,
//   sameSite: "none",
//   maxAge: 1000 * 60 * 60 * 24 * 7
// }
//   })
// );

// // 🔥 ENSURE UPLOAD FOLDERS EXIST (RENDER FIX)
// const uploadPath = path.join(__dirname, "uploads");
// const paymentPath = path.join(__dirname, "uploads/payments");

// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath);
// }

// if (!fs.existsSync(paymentPath)) {
//   fs.mkdirSync(paymentPath, { recursive: true });
// }
// app.use(passport.initialize());
// app.use(passport.session());

// // API routes
// app.use("/api/auth", require("./routes/auth"));
// app.use("/api/products", require("./routes/products"));
// app.use("/api/orders", require("./routes/orders"));
// app.use("/api/users", require("./routes/users"));
// app.use("/api/vouchers", require("./routes/vouchers"));

// app.use("/api/admin/dashboard", require("./routes/adminDashboard"));
// app.use("/api/admin/orders", require("./routes/adminOrders"));
// app.use("/api/admin/users", adminUsersRoutes);
// app.use("/api", reviewRoutes);
// app.use("/api/cart", require("./routes/cart"));
// app.use("/api/contact", contactRoute);

// // Serve frontend
// app.use(express.static(path.join(__dirname, "../frontend")));
// app.use("/uploads", express.static("uploads"));

// app.get("/api/health", (req, res) => {
//   res.json({
//     status: "OK",
//     uptime: process.uptime(),
//     time: new Date()
//   });
// });

// // MongoDB
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB connected"))
//   .catch(err => {
//   console.error("MongoDB connection failed:", err);
//   process.exit(1);
// });

//   // GLOBAL ERROR HANDLER (must be after all routes)
// app.use((err, req, res, next) => {
//   console.error("🔥 UNHANDLED ERROR:", err);

//   res.status(err.status || 500).json({
//     success: false,
//     message: "Something went wrong. Please try again."
//   });
// });

// const PORT = process.env.PORT || 4000;

// app.listen(PORT, () => {
//   console.log(`Kickbarks running on port ${PORT}`);
// });

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const passport = require("passport");
require("./config/googleAuth");

const reviewRoutes = require("./routes/reviewRoutes");
const rateLimit = require("express-rate-limit");

const adminUsersRoutes = require("./routes/adminUsers");
const contactRoute = require("./routes/contact");

const app = express();

app.disable("x-powered-by");

const isDev = process.env.NODE_ENV !== "production";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 100,
  skip: (req) => req.method === "OPTIONS"
});

app.use("/api", apiLimiter);

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:4000",
    "http://127.0.0.1:4000", 
    "http://localhost:8080",
    "https://kickbarksmotoshop.onrender.com"
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    name: "kickbarks.sid",
    secret: process.env.SESSION_SECRET || "kickbarks_local_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

// Ensure upload folders exist
const uploadPath = path.join(__dirname, "uploads");
const paymentPath = path.join(__dirname, "uploads/payments");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

if (!fs.existsSync(paymentPath)) {
  fs.mkdirSync(paymentPath, { recursive: true });
}

app.use(passport.initialize());
app.use(passport.session());

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/users", require("./routes/users"));
app.use("/api/vouchers", require("./routes/vouchers"));

app.use("/api/admin/dashboard", require("./routes/adminDashboard"));
app.use("/api/admin/orders", require("./routes/adminOrders"));
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api", reviewRoutes);
app.use("/api/cart", require("./routes/cart"));
app.use("/api/contact", contactRoute);

// Serve local frontend and uploads
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    time: new Date()
  });
});

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
app.get("/", (req, res) => {
  res.send("Backend is running");
});
// Global error handler
app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: "Something went wrong. Please try again."
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Kickbarks running locally on http://localhost:${PORT}`);
});
