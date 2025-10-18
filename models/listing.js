const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  image: {
    url: String,
    filename: String,
  },
  price: Number,
  location: String,
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  category: {
    type: [String],
  },
});

// 🧹 Post middleware to delete all reviews when a listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

// 🧹 Pre middleware to delete reviews when multiple listings are deleted
listingSchema.pre(
  "deleteMany",
  { document: false, query: true },
  async function () {
    const listings = await this.model.find(this.getFilter());
    const reviewIds = listings.flatMap((listing) => listing.reviews);
    await Review.deleteMany({ _id: { $in: reviewIds } });
  }
);

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
