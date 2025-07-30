const mongoose = require("mongoose");

const repairerSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  expertise: [String],
  available: { type: Boolean, default: true },
  phone: String,
  isRepairer: { type: Boolean, default: true },
  issues: [{ type: mongoose.Schema.Types.ObjectId, ref: "Issue" }],
  // New fields for address and geolocation
  pin: { type: String },
  state: { type: String },
  city: { type: String },
  geoloc: {
    lat: { type: Number },
    long: { type: Number },
  },
});

module.exports = mongoose.model("Repairer", repairerSchema);
