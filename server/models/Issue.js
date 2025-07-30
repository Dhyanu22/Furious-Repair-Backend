const mongoose = require("mongoose");

const IssueSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  repairer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repairer",
    default: null,
  },
  deviceType: String,
  vehicleType: String,
  description: String,
  estimatedPrice: String,
  dateReported: { type: Date, default: Date.now },
  status: { type: String, default: "pending" },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  // New fields for location
  city: String,
  state: String,
  pin: String,
  geoloc: {
    lat: Number,
    long: Number,
  },
});

module.exports = mongoose.model("Issue", IssueSchema);
