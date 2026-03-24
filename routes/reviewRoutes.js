const express = require("express");
const router = express.Router();
const Review = require("../model/Review");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "kickbarks/reviews",
    allowed_formats: ["jpg", "png", "jpeg", "webp"]
  }
});

const upload = multer({ storage });
// Add review
router.post("/add-review", upload.array("images", 5), async (req, res) => {

  try {

    if(!req.session.userId){
      return res.status(401).json({ error: "Login required" });
    }

    const { productId, rating, comment } = req.body;
    const images = req.files ? req.files.map(file => file.path) : [];

    const review = new Review({
      productId,
      rating,
      comment,
      images, // ✅ SAVE IMAGES HERE
      userId: req.session.userId   // ✅ attach logged in user
    });

    await review.save();

    res.json({ success: true });

  } catch (err) {

    console.error("Review error:", err);

    res.status(500).json({ error: err.message });

  }

});


// Get product reviews
router.get("/reviews/:productId", async (req, res) => {

  const reviews = await Review.find({
    productId: req.params.productId
  }).populate("userId", "name");

  res.json(reviews);

});
const mongoose = require("mongoose");

// Get rating summary
router.get("/reviews-summary/:productId", async (req, res) => {

  try{

    const productId = new mongoose.Types.ObjectId(req.params.productId);

    const result = await Review.aggregate([
      { $match: { productId: productId } },
      {
        $group: {
          _id: "$productId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if(result.length === 0){
      return res.json({
        avgRating: 0,
        totalReviews: 0
      });
    }

    res.json({
      avgRating: result[0].avgRating,
      totalReviews: result[0].totalReviews
    });

  }catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }

});
module.exports = router;