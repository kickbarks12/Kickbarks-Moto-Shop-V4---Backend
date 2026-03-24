const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/User");
const crypto = require("crypto");
const generateVoucherCode = require("../utils/voucher");
const UserVoucher = require("../model/UserVoucher");
const cloudinary = require("../config/cloudinary");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // callbackURL: "https://kickbarks-moto-shop.onrender.com/api/auth/google/callback"
      callbackURL: "http://localhost:4000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleAvatar = profile.photos?.[0]?.value || "";

        let user = await User.findOne({ email });

        let avatarUrl = googleAvatar;

        if (googleAvatar) {
          try {
            const uploaded = await cloudinary.uploader.upload(googleAvatar, {
              folder: "kickbarks/avatars"
            });
            avatarUrl = uploaded.secure_url;
          } catch (uploadErr) {
            console.error("Google avatar upload failed:", uploadErr.message);
          }
        }

        if (!user) {
          user = await User.create({
  name: profile.displayName,
  email,
  avatar: avatarUrl,
  avatarSource: "google", // ✅ ADD THIS
  password: crypto.randomBytes(32).toString("hex")
});

          const voucherCode = generateVoucherCode();

          await UserVoucher.create({
            userId: user._id,
            code: voucherCode,
            amount: 100,
            minSpend: 500
          });
        } else {
          if (avatarUrl && user.avatarSource === "google") {
  if (user.avatar !== avatarUrl) {
    user.avatar = avatarUrl;
    await user.save();
  }
}
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});