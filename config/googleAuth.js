const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/User");
const crypto = require("crypto");
const generateVoucherCode = require("../utils/voucher");
const UserVoucher = require("../model/UserVoucher");

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

        let user = await User.findOne({ email: profile.emails[0].value });
const googleAvatar = profile.photos[0].value.replace("s96-c","s400-c");
        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: googleAvatar, // ⭐ SAVE GOOGLE PHOTO
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

  // update avatar if changed
  if (user.avatar !== googleAvatar) {
    user.avatar = googleAvatar;
    await user.save();
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
  const user = await User.findById(id);
  done(null, user);
});